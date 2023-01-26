import { Component, OnInit } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AverageWeight } from 'src/models/models/weight-log.model';
import {
  IonicWeightLogService,
  Settings,
} from 'src/services/ionic-weight-log.service';

@Component({
  selector: 'app-achievements-tab',
  templateUrl: 'achievements.page.html',
  styleUrls: ['achievements.page.scss'],
})
export class AchievementsPage implements OnInit {
  lowestWeightAverage$: Observable<AverageWeight>;
  userSettings$: Observable<Settings>;

  constructor(private weightLogService: IonicWeightLogService) {}

  ngOnInit(): void {
    this.lowestWeightAverage$ = this.weightLogService.avgWeightLog$.pipe(
      map((log) => log.lowestWeightAverage)
    );
    this.userSettings$ = this.weightLogService.settings$;
  }
}
