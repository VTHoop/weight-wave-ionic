import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WeightEntryModalComponent } from './weight-entry-modal.component';

@NgModule({
  imports: [FormsModule, ReactiveFormsModule, CommonModule, IonicModule],
  declarations: [WeightEntryModalComponent],
  exports: [WeightEntryModalComponent],
})
export class WeightEntryModalModule {}
