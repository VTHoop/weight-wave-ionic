import { Component, OnInit } from '@angular/core';
import { RangeCustomEvent } from '@ionic/angular';
import { first, map, Observable } from 'rxjs';
import { MacroLogId } from 'src/models/models/macro-log-model';
import { WeightLogId } from 'src/models/models/weight-log.model';
import { IonicStorageService } from 'src/services/ionic-storage.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-macro-tracker',
  templateUrl: './macro-tracker.component.html',
  styleUrls: ['./macro-tracker.component.scss'],
})
export class MacroTrackerComponent implements OnInit {
  todaysMacros: MacroLogId;
  caloriesToday: number;

  constructor(private readonly storageService: IonicStorageService) {}

  ngOnInit() {
    this.getTodaysMacros();
  }

  onCarbChange($event: Event) {
    this.todaysMacros.pnCarbs = ($event as RangeCustomEvent).detail
      .value as number;
    this.saveMacros();
  }

  onFatChange($event: Event) {
    this.todaysMacros.pnFat = ($event as RangeCustomEvent).detail
      .value as number;
    this.saveMacros();
  }

  onProteinChange($event: Event) {
    this.todaysMacros.pnProtein = ($event as RangeCustomEvent).detail
      .value as number;
    this.saveMacros();
  }

  onAlcoholChange($event: Event) {
    this.todaysMacros.pnAlcohol = ($event as RangeCustomEvent).detail
      .value as number;
    this.saveMacros();
  }

  private getTodaysMacros(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.storageService.macroLog$.pipe(first()).subscribe((entries) => {
      const foundEntry = entries.find((entry) => {
        const itemDate = new Date(entry.logDate);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === today.getTime();
      });
      this.todaysMacros = foundEntry
        ? foundEntry
        : { id: uuidv4(), logDate: new Date(), creationDate: new Date() };
      this.calcCalories();
    });
  }

  private saveMacros(): void {
    this.storageService.upsertMacroLogEntry(this.todaysMacros);
    this.calcCalories();
    // this.getTodaysMacros();
  }

  private calcCalories(): void {
    this.caloriesToday =
      (this.todaysMacros.pnProtein || 0) * 145 +
      (this.todaysMacros.pnFat || 0) * 100 +
      (this.todaysMacros.pnCarbs || 0) * 125 +
      (this.todaysMacros.pnAlcohol || 0) * 150;
  }

  pinFormatter(value: number) {
    return `${value}`;
  }
}
