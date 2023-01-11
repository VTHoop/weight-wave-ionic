import { Component, OnInit } from '@angular/core';
import { AverageWeight } from 'src/models/models/weight-log.model';
import { WeightLogService } from 'src/services/weight-log.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-week-progress',
  templateUrl: './week-progress.component.html',
  styleUrls: ['./week-progress.component.scss'],
})
export class WeekProgressComponent implements OnInit {
  compareToLastWeek$: Observable<AverageWeight[]>;

  constructor(public weightLogService: WeightLogService) {}

  ngOnInit(): void {
    this.compareToLastWeek$ = this.weightLogService.getWeekByWeekAverage(
      2,
      new Date()
    );
  }
}
