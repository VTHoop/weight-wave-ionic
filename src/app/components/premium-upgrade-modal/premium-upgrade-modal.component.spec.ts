import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PremiumUpgradeModalComponent } from './premium-upgrade-modal.component';

describe('PremiumUpgradeModalComponent', () => {
  let component: PremiumUpgradeModalComponent;
  let fixture: ComponentFixture<PremiumUpgradeModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PremiumUpgradeModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PremiumUpgradeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});