import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { IonicModule } from '@ionic/angular';
import { TrendChartEchartsComponent } from './trend-chart-echarts.component';

@NgModule({
  imports: [
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
    CommonModule,
    IonicModule,
  ],
  declarations: [TrendChartEchartsComponent],
  exports: [TrendChartEchartsComponent],
})
export class TrendChartsEChartsComponentModule {}
