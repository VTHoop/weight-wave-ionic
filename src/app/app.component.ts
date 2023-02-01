import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';

// import { AdMob, AdMobInitializationOptions } from '@capacitor-community/admob';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private platform: Platform) {
    // this.initializeApp();
  }

  // initializeApp() {
  //   this.platform.ready().then(() => {
  //     /**
  //      * initialize() require after platform.ready();
  //      */
  //     AdMob.initialize({
  //       requestTrackingAuthorization: true,
  //       testingDevices: ['581e9ff8-0552-4912-8036-d70b1fcb8d97'],
  //       initializeForTesting: true,
  //     });
  //   });
  // }
}
