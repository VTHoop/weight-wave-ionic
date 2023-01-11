import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';
import { TrendChartsComponent } from './trend-charts.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [TrendChartsComponent],
  exports: [TrendChartsComponent],
})
export class TrendChartsComponentModule {}
