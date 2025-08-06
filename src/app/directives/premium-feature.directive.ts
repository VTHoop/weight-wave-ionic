import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SubscriptionService } from 'src/services/subscription.service';

@Directive({
  selector: '[appPremiumFeature]'
})
export class PremiumFeatureDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hasView = false;

  @Input() set appPremiumFeature(condition: boolean | '') {
    // If no condition provided or condition is true, check premium status
    // If condition is false, always hide
    if (condition === false) {
      this.updateView(false);
    } else {
      this.checkPremiumAccess();
    }
  }

  @Input() appPremiumFeatureElse?: TemplateRef<any>;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit() {
    this.subscriptionService.subscriptionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkPremiumAccess();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async checkPremiumAccess() {
    const hasAccess = await this.subscriptionService.checkPremiumAccess();
    this.updateView(hasAccess);
  }

  private updateView(show: boolean) {
    if (show && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!show && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
      
      // Show else template if premium access is not available
      if (this.appPremiumFeatureElse) {
        this.viewContainer.createEmbeddedView(this.appPremiumFeatureElse);
      }
    } else if (!show && !this.hasView && this.appPremiumFeatureElse) {
      this.viewContainer.createEmbeddedView(this.appPremiumFeatureElse);
    }
  }
}