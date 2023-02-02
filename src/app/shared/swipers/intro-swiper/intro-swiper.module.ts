import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';
import { IntroSwiperComponent } from './intro-swiper.component';

import { SwiperModule } from 'swiper/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SwiperModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [IntroSwiperComponent],
  exports: [IntroSwiperComponent],
})
export class IntroSwiperComponentModule {}
