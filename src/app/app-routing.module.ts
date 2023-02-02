import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { userSetupGuard } from './auth/user-setup.guard';
import { IntroSwiperComponent } from './shared/swipers/intro-swiper/intro-swiper.component';
import { IntroSwiperComponentModule } from './shared/swipers/intro-swiper/intro-swiper.module';

const routes: Routes = [
  {
    path: 'app-intro',
    component: IntroSwiperComponent,
  },
  {
    path: '',
    loadChildren: () =>
      import('./tabs/tabs.module').then((m) => m.TabsPageModule),
    canActivate: [userSetupGuard],
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
    IntroSwiperComponentModule,
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
