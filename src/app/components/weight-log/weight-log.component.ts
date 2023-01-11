import { Component, OnInit } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { WeightLog } from 'src/models/models/weight-log.model';
import { WeightLogService } from 'src/services/weight-log.service';

@Component({
  selector: 'app-weight-log',
  templateUrl: './weight-log.component.html',
  styleUrls: ['./weight-log.component.scss'],
})
export class WeightLogComponent implements OnInit {
  weightLog$: Observable<WeightLog[]> = of([]);

  constructor(public weightLogService: WeightLogService) {}

  ngOnInit(): void {
    this.weightLog$ = this.weightLogService.weightLog$.pipe(
      map((log) =>
        log.sort(
          (
            a,
            b //@ts-ignore
          ) => b.weightDate - a.weightDate
        )
      )
    );
  }
}
