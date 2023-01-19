import { Component, OnInit } from '@angular/core';
import { AverageWeight } from 'src/models/models/weight-log.model';
import { WeightLogService } from 'src/services/weight-log.service';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { MovingAverageService } from 'src/services/moving-average.service';

@Component({
  selector: 'app-week-progress',
  templateUrl: './week-progress.component.html',
  styleUrls: ['./week-progress.component.scss'],
})
export class WeekProgressComponent implements OnInit {
  weekToWeekComparison$: Observable<AverageWeight[]>;
  weeksToCompare$: BehaviorSubject<number> = new BehaviorSubject(2);
  public ProgressPeriod: any = ProgressPeriod;
  selectedProgressPeriod = ProgressPeriod.Week;

  constructor(
    public weightLogService: WeightLogService,
    public movingAverageService: MovingAverageService
  ) {}

  ngOnInit(): void {
    this.weekToWeekComparison$ = combineLatest([
      this.weightLogService.weightLog$,
      this.weeksToCompare$,
    ]).pipe(
      map(([log, weeksToCompare]) =>
        this.movingAverageService.getWeekByWeekAverage(
          log,
          weeksToCompare,
          new Date()
        )
      )
    );
  }

  changeFilter(progressPeriod: ProgressPeriod) {
    switch (progressPeriod) {
      case ProgressPeriod.Week:
        this.selectedProgressPeriod = ProgressPeriod.Week;
        this.weeksToCompare$.next(2);
        break;
      case ProgressPeriod.Month:
        this.selectedProgressPeriod = ProgressPeriod.Month;
        this.weeksToCompare$.next(5);
        break;
    }
  }

  getSalutation(): string {
    const now = new Date();
    if (now.getHours() >= 0 && now.getHours() < 11) {
      return 'Good Morning';
    } else if (now.getHours() >= 11 && now.getHours() < 19) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }
}

enum ProgressPeriod {
  Week = 'Week',
  Month = 'Month',
}
