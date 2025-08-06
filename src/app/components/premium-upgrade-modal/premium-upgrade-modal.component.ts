import { Component, OnInit } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { SubscriptionService } from 'src/services/subscription.service';

@Component({
  selector: 'app-premium-upgrade-modal',
  templateUrl: './premium-upgrade-modal.component.html',
  styleUrls: ['./premium-upgrade-modal.component.scss']
})
export class PremiumUpgradeModalComponent implements OnInit {
  
  premiumFeatures = [
    {
      icon: 'analytics-outline',
      title: 'Advanced Analytics',
      description: 'Get detailed insights into your weight trends and patterns'
    },
    {
      icon: 'cloud-upload-outline',
      title: 'Cloud Backup',
      description: 'Automatically sync your data across all devices'
    },
    {
      icon: 'fitness-outline',
      title: 'Body Composition Tracking',
      description: 'Track muscle and fat percentages with detailed charts'
    },
    {
      icon: 'notifications-outline',
      title: 'Smart Reminders',
      description: 'Custom notifications to help you stay on track'
    },
    {
      icon: 'document-outline',
      title: 'Export Data',
      description: 'Export your data in multiple formats (CSV, PDF)'
    }
  ];

  isLoading = false;

  constructor(
    private modalController: ModalController,
    private subscriptionService: SubscriptionService,
    private platform: Platform
  ) {}

  ngOnInit() {}

  async startFreeTrial() {
    this.isLoading = true;
    try {
      await this.subscriptionService.startFreeTrial(7);
      await this.dismiss(true);
    } catch (error) {
      console.error('Error starting free trial:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async purchasePremium() {
    this.isLoading = true;
    try {
      if (this.platform.is('hybrid')) {
        await this.subscriptionService.purchaseProduct('premium_monthly');
        await this.dismiss(true);
      } else {
        // For testing on web platform
        await this.subscriptionService.setPremiumStatus(true);
        await this.dismiss(true);
      }
    } catch (error) {
      console.error('Error purchasing premium:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async restorePurchases() {
    this.isLoading = true;
    try {
      const restored = await this.subscriptionService.restorePurchases();
      if (restored) {
        await this.dismiss(true);
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async dismiss(upgraded: boolean = false) {
    await this.modalController.dismiss(upgraded);
  }
}