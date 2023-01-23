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
} from 'rxjs';

import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { AverageWeight, WeightLogId } from 'src/models/models/weight-log.model';
import {
  WeightUnitAbbreviation,
  WeightUnitDisplay,
} from 'src/models/enums/weight-unit.enum';
import { seedData } from 'src/models/seed-data';
import { MovingAverageService } from './moving-average.service';

@Injectable({
  providedIn: 'root',
})
export class IonicWeightLogService {
  public storageReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _userSettings$ = new ReplaySubject<Settings>(1);
  private _weightLog$ = new ReplaySubject<WeightLogId[]>(1);
  private _avgWeightLog$: Observable<AverageWeight[]>;

  constructor(
    private storage: Storage,
    private movingAverageService: MovingAverageService
  ) {
    this.init();
    this._avgWeightLog$ = this.weightLog$.pipe(
      map((log) => movingAverageService.calcMovingAverageForEverything(log, 7))
    );
  }

  async init() {
    await this.storage.defineDriver(CordovaSQLiteDriver);
    await this.storage.create();
    this.storageReady.next(true);
    this.loadSettings();
    this.loadWeightLog();
  }

  public async saveSettings(value: any) {
    await this.storage?.set(WeightLogStorage.Settings, value);
    this.loadSettings();
  }

  get weightLog$() {
    return this._weightLog$.asObservable();
  }

  get avgWeightLog$() {
    return this._avgWeightLog$;
  }

  public async insertWeightLogEntry(value: WeightLogId) {
    const storedData: WeightLogId[] =
      (await this.storage.get(WeightLogStorage.WeightLog)) || [];
    storedData.push(value);
    await this.storage.set(WeightLogStorage.WeightLog, storedData);
    this.loadWeightLog();
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
        map(([dbReady, settings]) => {
          if (dbReady) {
            this._userSettings$.next(settings);
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
              this.seedWeightLog();
            }
            this._weightLog$.next(
              log.sort(
                (
                  a,
                  b //@ts-ignore
                ) => a.weightDate - b.weightDate
              )
            );
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
