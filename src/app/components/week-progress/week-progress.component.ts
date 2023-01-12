import { Component, OnInit } from '@angular/core';
import { AverageWeight } from 'src/models/models/weight-log.model';
import { WeightLogService } from 'src/services/weight-log.service';
import { Observable } from 'rxjs';
import { MovingAverageService } from 'src/services/moving-average.service';

@Component({
  selector: 'app-week-progress',
  templateUrl: './week-progress.component.html',
  styleUrls: ['./week-progress.component.scss'],
})
export class WeekProgressComponent implements OnInit {
  compareToLastWeek$: Observable<AverageWeight[]>;

  constructor(
    public weightLogService: WeightLogService,
    public movingAverageService: MovingAverageService
  ) {}

  ngOnInit(): void {
    this.compareToLastWeek$ = this.movingAverageService.getWeekByWeekAverage(
      this.weightLogService.weightLog$,
      2,
      new Date()
    );
  }
}
