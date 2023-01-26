import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AchievementsPage } from './achievements.page';

import { AchievementsPageRoutingModule } from './achievements-tab-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    AchievementsPageRoutingModule,
  ],
  declarations: [AchievementsPage],
})
export class AchievementsPageModule {}
