import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { IonicStorageService } from 'src/services/ionic-storage.service';

export const userSetupGuard = () => {
  const weightLogService = inject(IonicStorageService);
  const router = inject(Router);

  return weightLogService.isUserSetup.pipe(
    map((isUserSetup) => {
      if (isUserSetup) {
        return true;
      }
      return router.navigateByUrl('app-intro');
    })
  );
};
