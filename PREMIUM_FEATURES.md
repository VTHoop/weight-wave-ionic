# Premium Features Implementation

This document explains how to use the premium subscription system in Weight Mate.

## Components Created

### Services
- `SubscriptionService` - Main service for managing premium status and in-app purchases
- Located in `src/services/subscription.service.ts`

### Guards
- `premiumGuard` - Route guard to protect premium routes
- Located in `src/app/auth/premium.guard.ts`

### Directives
- `PremiumFeatureDirective` - Conditional display of premium features
- Located in `src/app/directives/premium-feature.directive.ts`

### Pipes
- `PremiumPipe` - Check premium status in templates
- Located in `src/app/pipes/premium.pipe.ts`

### Components
- `PremiumUpgradeModalComponent` - Modal for upgrading to premium
- Located in `src/app/components/premium-upgrade-modal/`

## Usage Examples

### 1. Protecting Routes with Premium Guard

```typescript
// In your routing module
{
  path: 'premium-feature',
  component: PremiumFeatureComponent,
  canActivate: [premiumGuard]
}
```

### 2. Conditional Display with Directive

```html
<!-- Show content only for premium users -->
<div *appPremiumFeature>
  <h2>Premium Feature</h2>
  <p>This content is only visible to premium users</p>
</div>

<!-- Show different content for non-premium users -->
<div *appPremiumFeature; else nonPremiumTemplate>
  <h2>Premium Charts</h2>
  <app-advanced-charts></app-advanced-charts>
</div>

<ng-template #nonPremiumTemplate>
  <div class="upgrade-prompt">
    <h3>Upgrade to Premium</h3>
    <p>Get advanced charts and more features</p>
    <ion-button (click)="showUpgradeModal()">Upgrade Now</ion-button>
  </div>
</ng-template>
```

### 3. Using Premium Pipe

```html
<!-- Check premium status in template -->
<ion-button *ngIf="true | premium | async" (click)="exportData()">
  Export Data
</ion-button>
```

### 4. Programmatic Premium Checks

```typescript
import { SubscriptionService } from 'src/services/subscription.service';

export class MyComponent {
  constructor(private subscriptionService: SubscriptionService) {}

  async someMethod() {
    const isPremium = await this.subscriptionService.checkPremiumAccess();
    if (isPremium) {
      // Show premium feature
    } else {
      // Show upgrade prompt
    }
  }

  // Subscribe to premium status changes
  ngOnInit() {
    this.subscriptionService.subscriptionStatus$.subscribe(status => {
      console.log('Premium status:', status.isPremium);
    });
  }
}
```

### 5. Showing Upgrade Modal

```typescript
import { ModalController } from '@ionic/angular';
import { PremiumUpgradeModalComponent } from 'src/app/components/premium-upgrade-modal/premium-upgrade-modal.component';

export class MyComponent {
  constructor(private modalController: ModalController) {}

  async showUpgradeModal() {
    const modal = await this.modalController.create({
      component: PremiumUpgradeModalComponent
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      console.log('User upgraded to premium!');
    }
  }
}
```

### 6. Managing Subscription Status

```typescript
// Start free trial
await this.subscriptionService.startFreeTrial(7); // 7 days

// Manually set premium status (for testing)
await this.subscriptionService.setPremiumStatus(true);

// Check current status
const status = await this.subscriptionService.getCurrentStatus();

// Restore purchases
const restored = await this.subscriptionService.restorePurchases();
```

## Integration Steps

1. **Add to Module**: The directive and pipe are already registered in `app.module.ts`

2. **Import in Components**: Import the modal module where needed:
```typescript
import { PremiumUpgradeModalModule } from 'src/app/components/premium-upgrade-modal/premium-upgrade-modal.module';
```

3. **Configure Products**: Update the product IDs in `SubscriptionService` to match your App Store/Play Store configuration

4. **Test on Device**: In-app purchases only work on physical devices with proper store configuration

## Notes

- The system uses `cordova-plugin-purchase` v13.12.1 for in-app purchases
- Free trial functionality is built-in with configurable duration
- Premium status is persisted locally using Ionic Storage
- Web platform includes testing functionality (auto-grants premium)
- All components follow your existing codebase patterns and styling