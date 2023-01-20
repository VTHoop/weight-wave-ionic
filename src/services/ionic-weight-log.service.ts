import { Injectable } from '@angular/core';

import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, filter, from, Observable, of, switchMap } from 'rxjs';

import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { Settings } from 'src/app/tab3/tab3.page';

@Injectable({
  providedIn: 'root',
})
export class IonicWeightLogService {
  public storageReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    await this.storage.defineDriver(CordovaSQLiteDriver);
    await this.storage.create();
    this.storageReady.next(true);
  }

  // TODO: key should be changed to the enum
  public async set(key: WeightLogStorage, value: any) {
    await this.storage?.set(key, value);
  }

  public getSettings(): Observable<Settings> {
    return this.storageReady.pipe(
      filter((ready) => ready),
      switchMap(
        (_) => from(this.storage.get(WeightLogStorage.Settings)) || of('')
      )
    );
  }

  public getKeys(): Observable<string[]> {
    return this.storageReady.pipe(
      filter((ready) => ready),
      switchMap((_) => from(this.storage.keys() || of([])))
    );
  }
}

export enum WeightLogStorage {
  Settings = 'settings',
}
