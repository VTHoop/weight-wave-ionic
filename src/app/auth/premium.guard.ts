import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { SubscriptionService } from 'src/services/subscription.service';

export const premiumGuard = () => {
  const subscriptionService = inject(SubscriptionService);
  const router = inject(Router);

  return subscriptionService.subscriptionStatus$.pipe(
    switchMap(async (status) => {
      const hasAccess = await subscriptionService.checkPremiumAccess();
      if (hasAccess) {
        return true;
      }
      return router.navigateByUrl('/tabs/settings?upgrade=true');
    })
  );
};