import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AverageWeight } from 'src/models/models/weight-log.model';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { MovingAverageService } from 'src/services/moving-average.service';
import { AnimationController } from '@ionic/angular';
import {
  IonicWeightLogService,
  weightMetrics,
} from 'src/services/ionic-weight-log.service';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';

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
  public ProgressPeriod: any = ProgressPeriod;
  selectedProgressPeriod = ProgressPeriod.Week;
  progressDisplay$: Observable<ProgressDisplay>;
  selectedImage: string = '/assets/person-circle-outline.svg';
  isFatLogger: boolean;
  isMuscleLogger: boolean;

  constructor(
    public movingAverageService: MovingAverageService,
    public ionicWeightLogService: IonicWeightLogService,
    private animationCtrl: AnimationController
  ) {}

  ngOnInit(): void {
    this.progressDisplay$ = combineLatest([
      this.ionicWeightLogService.weightLog$,
      this.weeksToCompare$,
      this.ionicWeightLogService.settings$,
    ]).pipe(
      map(([log, weeksToCompare, settings]) => {
        this.isFatLogger = settings.isLoggingFat;
        this.isMuscleLogger = settings.isLoggingMuscle;
        this.selectedImage = settings.profilePicUrl
          ? settings.profilePicUrl
          : this.selectedImage;
        const changeOverTime = this.movingAverageService.getWeekByWeekAverage(
          log,
          weeksToCompare,
          new Date()
        );
        const progressDisplay: ProgressDisplay =
          settings.weightMetricDisplay === weightMetrics.pounds.name
            ? {
                weight: changeOverTime[0].avgWeightLbs,
                weightChange:
                  changeOverTime[0].avgWeightLbs -
                  changeOverTime[weeksToCompare - 1].avgWeightLbs,
                fat: changeOverTime[0].avgFatLbs,
                fatChange:
                  changeOverTime[0].avgFatLbs -
                  changeOverTime[weeksToCompare - 1].avgFatLbs,
                muscle: changeOverTime[0].avgMuscleLbs,
                muscleChange:
                  changeOverTime[0].avgMuscleLbs -
                  changeOverTime[weeksToCompare - 1].avgMuscleLbs,
                unitAbbrev: weightMetrics.pounds.abbreviation,
                name: settings.personName,
              }
            : {
                weight: changeOverTime[0].avgWeightKgs,
                weightChange:
                  changeOverTime[0].avgWeightKgs -
                  changeOverTime[weeksToCompare - 1].avgWeightKgs,
                fat: changeOverTime[0].avgFatKgs,
                fatChange:
                  changeOverTime[0].avgFatKgs -
                  changeOverTime[weeksToCompare - 1].avgFatKgs,
                muscle: changeOverTime[0].avgMuscleKgs,
                muscleChange:
                  changeOverTime[0].avgMuscleKgs -
                  changeOverTime[weeksToCompare - 1].avgMuscleKgs,
                unitAbbrev: weightMetrics.kilograms.abbreviation,
                name: settings.personName,
              };
        return progressDisplay;
      })
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

  async onPickImage() {
    const image = await Camera.getPhoto({
      quality: 50,
      source: CameraSource.Prompt,
      correctOrientation: true,
      resultType: CameraResultType.Uri,
    });
    // this.selectedImage = image.webPath;
    this.ionicWeightLogService.saveProfilePic(image.webPath);
  }
}

enum ProgressPeriod {
  Week = 'Week',
  Month = 'Month',
}

interface ProgressDisplay {
  weight: number;
  weightChange: number;
  fat?: number;
  fatChange?: number;
  muscle?: number;
  muscleChange?: number;
  unitAbbrev: string;
  name: string;
}
