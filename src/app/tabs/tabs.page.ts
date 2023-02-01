import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
// import {
//   AdMob,
//   AdMobBannerSize,
//   BannerAdOptions,
//   BannerAdPluginEvents,
//   BannerAdPosition,
//   BannerAdSize,
// } from '@capacitor-community/admob';
import { PluginListenerHandle } from '@capacitor/core';

import { Observable, of, ReplaySubject } from 'rxjs';
import { WeightLogId } from 'src/models/models/weight-log.model';
import {
  IonicWeightLogService,
  Settings,
} from 'src/services/ionic-weight-log.service';
import { WeightEntryModalComponent } from '../components/weight-entry-modal/weight-entry-modal.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage implements OnInit {
  // public readonly bannerSizes: BannerAdSize[] = Object.keys(
  //   BannerAdSize
  // ) as BannerAdSize[];
  // public currentBannerSize?: BannerAdSize;

  private readonly lastBannerEvent$$ = new ReplaySubject<{
    name: string;
    value: any;
  }>(1);
  public readonly lastBannerEvent$ = this.lastBannerEvent$$.asObservable();

  private appMargin = 0;
  private bannerPosition: 'top' | 'bottom';

  public isLoading = false;

  public isPrepareBanner = false;

  private readonly listenerHandlers: PluginListenerHandle[] = [];

  @ViewChild(WeightEntryModalComponent)
  private weightEntryModalComponent: WeightEntryModalComponent;

  todaysLog$: Observable<WeightLogId[]> = of();
  userSettings$: Observable<Settings>;

  constructor(
    private ionicWeightLogService: IonicWeightLogService,
    private readonly ngZone: NgZone
  ) {}

  ionViewWillEnter() {
    /**
     * Run every time the Ad height changes.
     * AdMob cannot be displayed above the content, so create margin for AdMob.
     */
    // const resizeHandler = AdMob.addListener(
    //   BannerAdPluginEvents.SizeChanged,
    //   (info: AdMobBannerSize) => {
    //     this.appMargin = info.height;
    //     const app: HTMLElement = document.querySelector('ion-router-outlet');
    //     if (this.appMargin === 0) {
    //       app.style.marginTop = '';
    //       return;
    //     }
    //     if (this.appMargin > 0) {
    //       const body = document.querySelector('body');
    //       const bodyStyles = window.getComputedStyle(body);
    //       const safeAreaBottom = bodyStyles.getPropertyValue(
    //         '--ion-safe-area-bottom'
    //       );
    //       if (this.bannerPosition === 'top') {
    //         app.style.marginTop = this.appMargin + 'px';
    //       } else {
    //         app.style.marginBottom = `calc(${safeAreaBottom} + ${this.appMargin}px)`;
    //       }
    //     }
    //   }
    // );
    // this.listenerHandlers.push(resizeHandler);
    // this.registerBannerListeners();
    // this.showBottomBanner();
  }

  ionViewWillLeave() {
    // this.listenerHandlers.forEach((handler) => handler.remove());
  }

  ngOnInit(): void {
    this.userSettings$ = this.ionicWeightLogService.settings$;
    // this.todaysLog$ = this.weightLogService.weightLog$.pipe(
    //   map((log) => {
    //     const today = new Date();
    //     today.setHours(0, 0, 0, 0);
    //     return log.filter(
    //       (entry) =>
    //         today.getTime() ===
    //         new Date(
    //           entry.creationDate.getFullYear(),
    //           entry.creationDate.getMonth(),
    //           entry.creationDate.getDate()
    //         ).getTime()
    //     );
    //   })
    // );
  }

  openModal() {
    this.weightEntryModalComponent.setOpen(true);
  }

  // async showBottomBanner() {
  //   const bannerBottomOptions: BannerAdOptions = {
  //     adId: 'ca-app-pub-6766209998974304~3505339004',
  //     adSize: BannerAdSize.ADAPTIVE_BANNER,
  //     position: BannerAdPosition.BOTTOM_CENTER,
  //     npa: true,
  //   };
  //   this.bannerPosition = 'bottom';
  //   await this.showBanner(bannerBottomOptions);
  // }

  // private async showBanner(options: BannerAdOptions): Promise<void> {
  //   const bannerOptions: BannerAdOptions = {
  //     ...options,
  //     adSize: this.currentBannerSize,
  //   };
  //   console.log('Requesting banner with this options', bannerOptions);

  //   const result = await AdMob.showBanner(bannerOptions).catch((e) =>
  //     console.error(e)
  //   );

  //   if (result === undefined) {
  //     return;
  //   }

  //   this.isPrepareBanner = true;
  // }

  // async hideBanner() {
  //   const result = await AdMob.hideBanner().catch((e) => console.log(e));
  //   if (result === undefined) {
  //     return;
  //   }

  //   const app: HTMLElement = document.querySelector('ion-router-outlet');
  //   app.style.marginTop = '0px';
  //   app.style.marginBottom = '0px';
  // }

  // async resumeBanner() {
  //   const result = await AdMob.resumeBanner().catch((e) => console.log(e));
  //   if (result === undefined) {
  //     return;
  //   }

  //   const app: HTMLElement = document.querySelector('ion-router-outlet');
  //   app.style.marginBottom = this.appMargin + 'px';
  // }

  // async removeBanner() {
  //   const result = await AdMob.removeBanner().catch((e) => console.log(e));
  //   if (result === undefined) {
  //     return;
  //   }

  //   const app: HTMLElement = document.querySelector('ion-router-outlet');
  //   app.style.marginBottom = '0px';
  //   this.appMargin = 0;
  //   this.isPrepareBanner = false;
  // }

  // private registerBannerListeners(): void {
  //   const eventKeys = Object.keys(BannerAdPluginEvents);

  //   eventKeys.forEach((key) => {
  //     console.log(`registering ${BannerAdPluginEvents[key]}`);
  //     const handler = AdMob.addListener(BannerAdPluginEvents[key], (value) => {
  //       console.log(`Banner Event "${key}"`, value);

  //       this.ngZone.run(() => {
  //         this.lastBannerEvent$$.next({ name: key, value: value });
  //       });
  //     });
  //     this.listenerHandlers.push(handler);
  //   });
  // }
}
