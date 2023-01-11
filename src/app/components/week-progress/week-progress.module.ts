import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { WeekProgressComponent } from './week-progress.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [WeekProgressComponent],
  exports: [WeekProgressComponent],
})
export class WeekProgressComponentModule {}
