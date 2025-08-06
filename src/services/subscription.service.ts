import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, from, combineLatest, tap, filter, switchMap, of } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { Capacitor } from '@capacitor/core';

declare var store: any;

export interface SubscriptionStatus {
  isPremium: boolean;
  subscriptionId?: string;
  expirationDate?: Date;
  productId?: string;
  isTrialActive?: boolean;
  trialExpirationDate?: Date;
}

export enum SubscriptionStorage {
  SubscriptionStatus = 'subscriptionStatus',
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private _subscriptionStatus$ = new ReplaySubject<SubscriptionStatus>(1);
  private storageReady: BehaviorSubject<boolean>;

  constructor(private storage: Storage) {
    this.storageReady = new BehaviorSubject(false);
    this.init();
  }

  async init() {
    await this.storage.create();
    this.storageReady.next(true);
    this.loadSubscriptionStatus();
    await this.initializeStore();
  }

  get subscriptionStatus$() {
    return this._subscriptionStatus$.asObservable();
  }

  get isPremium$() {
    return this._subscriptionStatus$.asObservable().pipe(
      tap(status => status.isPremium)
    );
  }

  async updateSubscriptionStatus(status: SubscriptionStatus) {
    await this.storage.set(SubscriptionStorage.SubscriptionStatus, status);
    this.loadSubscriptionStatus();
  }

  async setPremiumStatus(isPremium: boolean, subscriptionDetails?: Partial<SubscriptionStatus>) {
    const currentStatus = await this.getCurrentStatus();
    const newStatus: SubscriptionStatus = {
      ...currentStatus,
      isPremium,
      ...subscriptionDetails
    };
    await this.updateSubscriptionStatus(newStatus);
  }

  async getCurrentStatus(): Promise<SubscriptionStatus> {
    const stored = await this.storage.get(SubscriptionStorage.SubscriptionStatus);
    return stored || { isPremium: false };
  }

  async checkPremiumAccess(): Promise<boolean> {
    const status = await this.getCurrentStatus();
    
    // Check if subscription is expired
    if (status.expirationDate && new Date() > new Date(status.expirationDate)) {
      await this.setPremiumStatus(false);
      return false;
    }
    
    // Check if trial is expired
    if (status.isTrialActive && status.trialExpirationDate && new Date() > new Date(status.trialExpirationDate)) {
      await this.setPremiumStatus(false, { isTrialActive: false });
      return false;
    }
    
    return status.isPremium || (status.isTrialActive || false);
  }

  async startFreeTrial(durationDays: number = 7) {
    const trialExpirationDate = new Date();
    trialExpirationDate.setDate(trialExpirationDate.getDate() + durationDays);
    
    await this.setPremiumStatus(true, {
      isTrialActive: true,
      trialExpirationDate
    });
  }

  async restorePurchases() {
    if (!Capacitor.isNativePlatform() || typeof store === 'undefined') {
      return false;
    }
    
    try {
      await store.refresh();
      const products = store.products;
      
      for (const product of products) {
        if (product.owned && product.id === 'premium_monthly') {
          await this.setPremiumStatus(true, {
            subscriptionId: product.transaction?.id,
            productId: product.id,
            expirationDate: product.expiryDate ? new Date(product.expiryDate) : undefined
          });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  }

  async initializeStore() {
    if (!Capacitor.isNativePlatform() || typeof store === 'undefined') {
      return;
    }

    try {
      // Register products
      store.register({
        id: 'premium_monthly',
        type: store.PAID_SUBSCRIPTION
      });

      // Set up event handlers
      store.when('premium_monthly').approved((product: any) => {
        console.log('Purchase approved:', product);
        product.finish();
      });

      store.when('premium_monthly').owned((product: any) => {
        console.log('Product owned:', product);
        this.setPremiumStatus(true, {
          subscriptionId: product.transaction?.id,
          productId: product.id,
          expirationDate: product.expiryDate ? new Date(product.expiryDate) : undefined
        });
      });

      store.when('premium_monthly').expired((product: any) => {
        console.log('Product expired:', product);
        this.setPremiumStatus(false);
      });

      store.error((error: any) => {
        console.error('Store error:', error);
      });

      // Refresh store
      await store.refresh();
    } catch (error) {
      console.error('Error initializing store:', error);
    }
  }

  async purchaseProduct(productId: string = 'premium_monthly') {
    if (!Capacitor.isNativePlatform() || typeof store === 'undefined') {
      throw new Error('In-app purchases not available on this platform');
    }

    try {
      const product = store.get(productId);
      if (product) {
        await store.order(productId);
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      console.error('Error purchasing product:', error);
      throw error;
    }
  }

  private loadSubscriptionStatus(): void {
    combineLatest([
      this.storageReady,
      from(this.storage.get(SubscriptionStorage.SubscriptionStatus))
    ]).pipe(
      tap(([dbReady, status]) => {
        if (dbReady) {
          const subscriptionStatus: SubscriptionStatus = status || { isPremium: false };
          this._subscriptionStatus$.next(subscriptionStatus);
        }
      })
    ).subscribe();
  }
}