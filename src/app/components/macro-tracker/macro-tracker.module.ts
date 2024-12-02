import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MacroTrackerComponent } from './macro-tracker.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [MacroTrackerComponent],
  imports: [CommonModule, IonicModule],
  exports: [MacroTrackerComponent],
})
export class MacroTrackerModule {}
