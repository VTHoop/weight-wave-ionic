import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeightLogPage } from './weight-log.page';

import { WeightLogTabPageRoutingModule } from './weight-log-tab-routing.module';
import { WeightLogModule } from '../../components/weight-log/weight-log.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    WeightLogModule,
    WeightLogTabPageRoutingModule,
  ],
  declarations: [WeightLogPage],
})
export class WeightLogPageModule {}
