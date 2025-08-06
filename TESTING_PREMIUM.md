# Testing Premium Features - Complete Guide

https://capacitorjs.com/docs/v4/guides/in-app-purchases

## **1. Browser Testing (Start Here)**

### Setup Test Feature

First, add a test premium feature to see the system working:

```typescript
// In src/app/pages/dashboard-tab/dashboard.page.ts
import { ModalController } from "@ionic/angular";
import { SubscriptionService } from "src/services/subscription.service";
import { PremiumUpgradeModalComponent } from "src/app/components/premium-upgrade-modal/premium-upgrade-modal.component";

export class DashboardPage {
  constructor(
    private modalController: ModalController,
    private subscriptionService: SubscriptionService
  ) {}

  async showUpgradeModal() {
    const modal = await this.modalController.create({
      component: PremiumUpgradeModalComponent,
    });
    await modal.present();
  }

  async togglePremium() {
    const status = await this.subscriptionService.getCurrentStatus();
    await this.subscriptionService.setPremiumStatus(!status.isPremium);
  }
}
```

```html
<!-- In src/app/pages/dashboard-tab/dashboard.page.html -->
<ion-content>
  <!-- Existing content -->

  <!-- Test Premium Features Section -->
  <div
    class="premium-test-section"
    style="padding: 16px; margin: 16px; border: 1px solid #ccc;"
  >
    <h3>Premium Feature Test</h3>

    <!-- This will only show for premium users -->
    <div *appPremiumFeature>
      <ion-card color="success">
        <ion-card-content>
          <h4>🎉 Premium Feature Active!</h4>
          <p>You have access to premium features</p>
        </ion-card-content>
      </ion-card>
    </div>

    <!-- This will show for non-premium users -->
    <div *appPremiumFeature="false">
      <ion-card color="warning">
        <ion-card-content>
          <h4>⭐ Upgrade to Premium</h4>
          <p>Unlock advanced features</p>
          <ion-button (click)="showUpgradeModal()">Upgrade Now</ion-button>
        </ion-card-content>
      </ion-card>
    </div>

    <!-- Testing buttons -->
    <ion-button (click)="togglePremium()" fill="outline">
      Toggle Premium Status (Testing)
    </ion-button>
  </div>
</ion-content>
```

### Browser Test Steps

1. Run `npm start`
2. Go to http://localhost:4200
3. Navigate to Dashboard tab
4. You should see the "Upgrade to Premium" card
5. Click "Upgrade Now" to see the premium modal
6. In the modal, click "Start 7-Day Free Trial"
7. The card should change to show "Premium Feature Active!"
8. Use "Toggle Premium Status" button to test both states

## **2. Mobile Simulator Testing**

### iOS Simulator

```bash
# Build and open in Xcode (requires macOS + Xcode)
npm run build
npx cap copy ios
npx cap open ios
```

### Android Emulator

```bash
# Build and open in Android Studio
npm run build
npx cap copy android
npx cap open android
```

**Note**: In-app purchases won't work in simulators, but you can test the UI flows.

## **3. Physical Device Testing**

### Prerequisites

- Apple Developer Account (iOS) or Google Play Console (Android)
- Test user accounts configured in App Store Connect/Google Play Console
- App configured with proper bundle IDs and certificates

### iOS Testing Steps

1. Configure test products in App Store Connect
2. Add test users in App Store Connect
3. Build signed app: `npx cap build ios`
4. Install via Xcode or TestFlight
5. Test with sandbox Apple ID

### Android Testing Steps

1. Configure test products in Google Play Console
2. Create internal testing track
3. Build signed app: `npx cap build android`
4. Upload to Play Console internal testing
5. Test with licensed tester account

## **4. Testing Scenarios**

### A. Free Trial Flow

```javascript
// In browser console or component
const subscriptionService = // inject service
  await subscriptionService.startFreeTrial(7);
```

### B. Premium Purchase Flow

- Test upgrade modal appearance
- Test "Purchase Premium" button (sandbox on device)
- Verify premium features unlock

### C. Restore Purchases

- Purchase premium on one device
- Install app on second device
- Test "Restore Purchases" button

### D. Subscription Expiration

```javascript
// Simulate expired subscription
await subscriptionService.setPremiumStatus(true, {
  expirationDate: new Date(Date.now() - 1000), // 1 second ago
});
```

## **5. Quick Test Component**

Create this test page for rapid testing:

```typescript
// src/app/test-premium/test-premium.page.ts
import { Component } from "@angular/core";
import {
  SubscriptionService,
  SubscriptionStatus,
} from "src/services/subscription.service";

@Component({
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Premium Testing</ion-title></ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>Current Status</h2>
      <pre>{{ status | json }}</pre>

      <ion-button (click)="setPremium(true)" color="success"
        >Set Premium</ion-button
      >
      <ion-button (click)="setPremium(false)" color="danger"
        >Remove Premium</ion-button
      >
      <ion-button (click)="startTrial()">Start Trial</ion-button>
      <ion-button (click)="expireSubscription()"
        >Expire Subscription</ion-button
      >

      <h3>Premium Feature Test</h3>
      <div *appPremiumFeature>
        <ion-card color="success">
          <ion-card-content>Premium Content Visible!</ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
})
export class TestPremiumPage {
  status: SubscriptionStatus = { isPremium: false };

  constructor(private subscriptionService: SubscriptionService) {
    this.loadStatus();
    this.subscriptionService.subscriptionStatus$.subscribe((status) => {
      this.status = status;
    });
  }

  async loadStatus() {
    this.status = await this.subscriptionService.getCurrentStatus();
  }

  async setPremium(premium: boolean) {
    await this.subscriptionService.setPremiumStatus(premium);
  }

  async startTrial() {
    await this.subscriptionService.startFreeTrial(7);
  }

  async expireSubscription() {
    await this.subscriptionService.setPremiumStatus(true, {
      expirationDate: new Date(Date.now() - 1000),
    });
  }
}
```

## **6. Debugging Tips**

### Check Storage

```javascript
// In browser console
const storage = document.querySelector("ion-app").__zone_symbol__state;
// Look for subscriptionStatus key
```

### Monitor Service

```typescript
// Add to any component
ngOnInit() {
  this.subscriptionService.subscriptionStatus$.subscribe(status => {
    console.log('Premium status changed:', status);
  });
}
```

### Network Issues

- Check if cordova-plugin-purchase is loaded: `console.log(typeof store)`
- Monitor store events in device logs

## **7. Production Testing Checklist**

- [ ] Test all premium feature gates
- [ ] Verify upgrade modal shows correctly
- [ ] Test free trial flow
- [ ] Test purchase flow (sandbox)
- [ ] Test restore purchases
- [ ] Verify subscription expiration handling
- [ ] Test on both iOS and Android
- [ ] Verify proper error handling
- [ ] Check analytics/logging

Start with browser testing using the test buttons, then move to device testing once the flows work correctly!
