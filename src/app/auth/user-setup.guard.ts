import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { IonicWeightLogService } from 'src/services/ionic-weight-log.service';

export const userSetupGuard = () => {
  const weightLogService = inject(IonicWeightLogService);
  const router = inject(Router);

  return weightLogService.isUserSetup
    .pipe(
      map((isUserSetup) => {
        if (isUserSetup) {
          return true;
        }
        return router.navigateByUrl('app-intro');
      })
    )
    .subscribe();
};
