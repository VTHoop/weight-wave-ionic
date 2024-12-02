import { Component, OnInit } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AverageWeight } from 'src/models/models/weight-log.model';
import {
  IonicStorageService,
  Settings,
} from 'src/services/ionic-storage.service';

@Component({
  selector: 'app-achievements-tab',
  templateUrl: 'achievements.page.html',
  styleUrls: ['achievements.page.scss'],
})
export class AchievementsPage implements OnInit {
  lowestWeightAverage$: Observable<AverageWeight>;
  userSettings$: Observable<Settings>;

  constructor(private ionicStorageService: IonicStorageService) {}

  ngOnInit(): void {
    this.lowestWeightAverage$ = this.ionicStorageService.avgWeightLog$.pipe(
      map((log) => log.lowestWeightAverage)
    );
    this.userSettings$ = this.ionicStorageService.settings$;
  }
}
