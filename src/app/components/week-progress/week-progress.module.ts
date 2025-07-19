import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { WeekProgressComponent } from './week-progress.component';
import { MacroTrackerModule } from '../macro-tracker/macro-tracker.module';

@NgModule({
  imports: [CommonModule, IonicModule, MacroTrackerModule],
  declarations: [WeekProgressComponent],
  exports: [WeekProgressComponent],
})
export class WeekProgressComponentModule {}
