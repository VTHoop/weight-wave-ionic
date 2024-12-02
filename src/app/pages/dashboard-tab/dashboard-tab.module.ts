import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardPage } from './dashboard.page';

import { DashboardPageRoutingModule } from './dashboard-tab-routing.module';
import { WeekProgressComponentModule } from '../../components/week-progress/week-progress.module';
import { TrendChartsComponentModule } from '../../components/trend-charts/trend-charts.module';
import { TrendChartsEChartsComponentModule } from 'src/app/components/trend-chart-echarts/trend-charts.module';
import { MacroTrackerModule } from '../../components/macro-tracker/macro-tracker.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    WeekProgressComponentModule,
    TrendChartsComponentModule,
    TrendChartsEChartsComponentModule,
    DashboardPageRoutingModule,
    MacroTrackerModule,
  ],
  declarations: [DashboardPage],
})
export class DashboardPageModule {}
