import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AverageWeight } from 'src/models/models/weight-log.model';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { MovingAverageService } from 'src/services/moving-average.service';
import { AnimationController } from '@ionic/angular';
import {
  IonicWeightLogService,
  Settings,
} from 'src/services/ionic-weight-log.service';

@Component({
  selector: 'app-week-progress',
  templateUrl: './week-progress.component.html',
  styleUrls: ['./week-progress.component.scss'],
})
export class WeekProgressComponent implements OnInit {
  @ViewChild('snapshotWeight', { read: ElementRef }) snapshotWeight: ElementRef;
  @ViewChild('snapshotFat', { read: ElementRef }) snapshotFat: ElementRef;
  @ViewChild('snapshotMuscle', { read: ElementRef }) snapshotMuscle: ElementRef;

  weekToWeekComparison$: Observable<AverageWeight[]>;
  weeksToCompare$: BehaviorSubject<number> = new BehaviorSubject(2);
  userSettings$: Observable<Settings>;
  public ProgressPeriod: any = ProgressPeriod;
  selectedProgressPeriod = ProgressPeriod.Week;

  constructor(
    public movingAverageService: MovingAverageService,
    public ionicWeightLogService: IonicWeightLogService,
    private animationCtrl: AnimationController
  ) {}

  ngOnInit(): void {
    this.weekToWeekComparison$ = combineLatest([
      this.ionicWeightLogService.weightLog$,
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
    this.getSettings();
  }

  getSettings() {
    this.userSettings$ = this.ionicWeightLogService.settings$;
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
    this.playAnimation();
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

  playAnimation() {
    this.animationCtrl
      .create('loading-animation')
      .addElement(this.snapshotWeight.nativeElement)
      .addElement(this.snapshotFat.nativeElement)
      .addElement(this.snapshotMuscle.nativeElement)
      .duration(500)
      .iterations(1)
      .fromTo('transform', 'translateY(20px)', 'translateY(0px)')
      .fromTo('opacity', '0.2', '1')
      .play();
  }
}

enum ProgressPeriod {
  Week = 'Week',
  Month = 'Month',
}
