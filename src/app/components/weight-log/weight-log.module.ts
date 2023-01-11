import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { WeightLogComponent } from './weight-log.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [WeightLogComponent],
  exports: [WeightLogComponent],
})
export class WeightLogModule {}
