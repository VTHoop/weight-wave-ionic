import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';

import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { PremiumFeatureDirective } from './directives/premium-feature.directive';
import { PremiumPipe } from './pipes/premium.pipe';

@NgModule({
  declarations: [AppComponent, PremiumFeatureDirective, PremiumPipe],
  imports: [
    IonicStorageModule.forRoot({
      name: '__weightLogStorage',
      driverOrder: [
        CordovaSQLiteDriver._driver,
        Drivers.IndexedDB,
        Drivers.LocalStorage,
      ],
    }),
    BrowserModule,
    AppRoutingModule,
    IonicModule.forRoot(),
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
