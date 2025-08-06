import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PremiumUpgradeModalComponent } from './premium-upgrade-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  declarations: [PremiumUpgradeModalComponent],
  exports: [PremiumUpgradeModalComponent]
})
export class PremiumUpgradeModalModule {}