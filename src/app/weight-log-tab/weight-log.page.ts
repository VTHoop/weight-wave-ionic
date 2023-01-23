import { Component, OnInit } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import {
  IonicWeightLogService,
  weightMetrics,
} from 'src/services/ionic-weight-log.service';

@Component({
  selector: 'weight-log-tab',
  templateUrl: 'weight-log.page.html',
  styleUrls: ['weight-log.page.scss'],
})
export class WeightLogPage implements OnInit {
  weightLogDisplay$: Observable<WeightLogDisplay[]>;

  constructor(private ionicWeightLogService: IonicWeightLogService) {}

  ngOnInit(): void {
    this.weightLogDisplay$ = combineLatest([
      this.ionicWeightLogService.settings$,
      this.ionicWeightLogService.weightLog$,
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
            ) => b.weightDate - a.weightDate
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
