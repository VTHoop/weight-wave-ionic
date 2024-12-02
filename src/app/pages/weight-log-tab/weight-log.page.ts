import { Component, OnInit } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import {
  IonicStorageService,
  Settings,
  weightMetrics,
} from 'src/services/ionic-storage.service';

@Component({
  selector: 'weight-log-tab',
  templateUrl: 'weight-log.page.html',
  styleUrls: ['weight-log.page.scss'],
})
export class WeightLogPage implements OnInit {
  weightLogDisplay$: Observable<WeightLogDisplay[]>;
  settings$: Observable<Settings>;

  constructor(private ionicStorageService: IonicStorageService) {}

  ngOnInit(): void {
    this.settings$ = this.ionicStorageService.settings$;

    this.weightLogDisplay$ = combineLatest([
      this.ionicStorageService.settings$,
      this.ionicStorageService.weightLog$,
    ]).pipe(
      map(([settings, log]) =>
        log
          .map((entry) => {
            const weightLogDisplay: WeightLogDisplay = {
              id: entry.id,
              weightDate: entry.weightDate,
              weight:
                settings.weightMetricDisplay === weightMetrics.kilograms.name
                  ? entry.weightKgs
                  : entry.weightLbs,
              fat:
                settings.weightMetricDisplay === weightMetrics.kilograms.name
                  ? entry.fatKgs
                  : entry.fatLbs,
              muscle:
                settings.weightMetricDisplay === weightMetrics.kilograms.name
                  ? entry.muscleKgs
                  : entry.muscleLbs,
            };
            return weightLogDisplay;
          })
          .sort(
            (
              a,
              b //@ts-ignore
            ) => new Date(b.weightDate) - new Date(a.weightDate)
          )
      )
    );
  }
}

export interface WeightLogDisplay {
  id: string;
  weightDate: Date;
  weight: number;
  fat: number;
  muscle: number;
}
