import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SubscriptionService } from 'src/services/subscription.service';

@Pipe({
  name: 'premium'
})
export class PremiumPipe implements PipeTransform {

  constructor(private subscriptionService: SubscriptionService) {}

  transform(value: any): Observable<boolean> {
    return this.subscriptionService.subscriptionStatus$.pipe(
      map(status => status.isPremium || (status.isTrialActive || false))
    );
  }
}