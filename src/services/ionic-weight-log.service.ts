import { Injectable } from '@angular/core';

import { Storage } from '@ionic/storage-angular';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  from,
  map,
  Observable,
  of,
  ReplaySubject,
  switchMap,
  tap,
} from 'rxjs';

import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { WeightLogId } from 'src/models/models/weight-log.model';
import {
  WeightUnitAbbreviation,
  WeightUnitDisplay,
} from 'src/models/enums/weight-unit.enum';
import { seedData } from 'src/models/seed-data';
import {
  MovingAverageData,
  MovingAverageService,
} from './moving-average.service';

@Injectable({
  providedIn: 'root',
})
export class IonicWeightLogService {
  public storageReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public isUserSetup = new ReplaySubject<boolean>(1);
  private _userSettings$ = new ReplaySubject<Settings>(1);
  private _weightLog$ = new ReplaySubject<WeightLogId[]>(1);
  private _avgWeightLog$ = new ReplaySubject<MovingAverageData>(1);

  constructor(
    private storage: Storage,
    private movingAverageService: MovingAverageService
  ) {
    this.init();
  }

  async init() {
    await this.storage.defineDriver(CordovaSQLiteDriver);
    await this.storage.create();
    this.storageReady.next(true);
    this.loadSettings();
    this.loadWeightLog();
    this.loadAverageWeightLog();
  }

  loadAverageWeightLog() {
    combineLatest([this.storageReady, this.weightLog$])
      .pipe(
        map(([dbReady, log]) => {
          if (dbReady) {
            this._avgWeightLog$.next(
              this.movingAverageService.calcMovingAverageForEverything(log, 7)
            );
          }
        })
      )
      .subscribe();
  }

  public async saveSettings(value: any) {
    await this.storage?.set(WeightLogStorage.Settings, value);
    this.isUserSetup.next(true);
    this.loadSettings();
  }

  public async saveProfilePic(profilePicUrl: string) {
    let storedData = await this.storage.get(WeightLogStorage.Settings);
    storedData = {
      ...storedData,
      profilePicUrl,
    };
    await this.storage.set(WeightLogStorage.Settings, storedData);
    this.loadSettings();
  }

  get weightLog$() {
    return this._weightLog$.asObservable();
  }

  get avgWeightLog$() {
    return this._avgWeightLog$.asObservable();
  }

  public async insertWeightLogEntry(value: WeightLogId) {
    const storedData: WeightLogId[] =
      (await this.storage.get(WeightLogStorage.WeightLog)) || [];
    // if (!value) {
    //   delete value.muscleAmount;
    // }
    // if (!value.fatAmount) {
    //   delete value.fatAmount;
    // }
    storedData.push(value);
    await this.storage.set(WeightLogStorage.WeightLog, storedData);
    this.loadWeightLog();
  }

  public async updateWeightLogEntry(value: WeightLogId) {
    const storedData: WeightLogId[] =
      (await this.storage.get(WeightLogStorage.WeightLog)) || [];
    const entryIndex = storedData.findIndex((entry) => entry.id === value.id);
    if (entryIndex !== -1) {
      storedData[entryIndex] = value;
      await this.storage.set(WeightLogStorage.WeightLog, storedData);
      this.loadWeightLog();
    }
  }

  public async deleteWeightLogEntry(id: string) {
    const storedData: WeightLogId[] =
      (await this.storage.get(WeightLogStorage.WeightLog)) || [];
    const entryIndex = storedData.findIndex((entry) => entry.id === id);
    if (entryIndex !== -1) {
      storedData.splice(entryIndex, 1);
      await this.storage.set(WeightLogStorage.WeightLog, storedData);
      this.loadWeightLog();
    }
  }

  get settings$() {
    return this._userSettings$.asObservable();
  }

  private loadSettings(): void {
    combineLatest([
      this.storageReady,
      from(this.storage.get(WeightLogStorage.Settings)),
    ])
      .pipe(
        tap(([dbReady, settings]) => {
          if (dbReady) {
            if (settings) {
              this._userSettings$.next(settings);
              this.isUserSetup.next(true);
            } else {
              this.isUserSetup.next(false);
            }
          }
        })
      )
      .subscribe();
  }

  private async seedWeightLog() {
    for (let i = 0; i < seedData.length; i++) {
      await this.insertWeightLogEntry(seedData[i]);
    }
  }

  private loadWeightLog(): void {
    combineLatest([
      this.storageReady,
      from(this.storage.get(WeightLogStorage.WeightLog)),
    ])
      .pipe(
        map(([dbReady, log]) => {
          if (dbReady) {
            if (!log) {
              // TODO: Remove this before Production
              this._weightLog$.next([]);
              // this.seedWeightLog();
            } else {
              this._weightLog$.next(
                log.sort(
                  (
                    a,
                    b //@ts-ignore
                  ) => new Date(a.weightDate) - new Date(b.weightDate)
                )
              );
            }
          }
        })
      )
      .subscribe();
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
  WeightLog = 'weightLog',
}

export interface Settings {
  personName: string;
  weightMetricDisplay: WeightUnitDisplay;
  isLoggingMuscle: boolean;
  isLoggingFat: boolean;
  profilePicUrl?: string;
}

export const weightMetrics = {
  pounds: {
    name: WeightUnitDisplay.Pounds,
    abbreviation: WeightUnitAbbreviation.LB,
  },
  kilograms: {
    name: WeightUnitDisplay.Kilograms,
    abbreviation: WeightUnitAbbreviation.KG,
  },
};
