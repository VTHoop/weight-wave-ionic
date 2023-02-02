import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { AverageWeight } from 'src/models/models/weight-log.model';
import { Observable } from 'rxjs';
import { MovingAverageService } from 'src/services/moving-average.service';
import { AnimationController } from '@ionic/angular';
import { IonicWeightLogService } from 'src/services/ionic-weight-log.service';
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

  @Input() progressDisplay$: Observable<ProgressDisplay>;
  @Input() profilePicUrl: string;
  @Input() isFatLogger: boolean;
  @Input() isMuscleLogger: boolean;

  @Output() comparisonPeriodChanged = new EventEmitter<number>();

  weekToWeekComparison$: Observable<AverageWeight[]>;
  public ProgressPeriod: any = ProgressPeriod;
  selectedProgressPeriod = ProgressPeriod.Week;

  constructor(
    public movingAverageService: MovingAverageService,
    public ionicWeightLogService: IonicWeightLogService,
    private animationCtrl: AnimationController
  ) {}

  ngOnInit(): void {}

  changeFilter(progressPeriod: ProgressPeriod) {
    switch (progressPeriod) {
      case ProgressPeriod.Week:
        this.selectedProgressPeriod = ProgressPeriod.Week;
        this.comparisonPeriodChanged.emit(2);
        break;
      case ProgressPeriod.Month:
        this.selectedProgressPeriod = ProgressPeriod.Month;
        this.comparisonPeriodChanged.emit(5);
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
      .duration(500)
      .iterations(1)
      .fromTo('transform', 'translateY(20px)', 'translateY(0px)')
      .fromTo('opacity', '0.2', '1')
      .play();

    if (this.isFatLogger) {
      this.animationCtrl
        .create('loading-animation')
        .addElement(this.snapshotFat.nativeElement)
        .duration(500)
        .iterations(1)
        .fromTo('transform', 'translateY(20px)', 'translateY(0px)')
        .fromTo('opacity', '0.2', '1')
        .play();
    }
    if (this.isMuscleLogger) {
      this.animationCtrl
        .create('loading-animation')
        .addElement(this.snapshotMuscle.nativeElement)
        .duration(500)
        .iterations(1)
        .fromTo('transform', 'translateY(20px)', 'translateY(0px)')
        .fromTo('opacity', '0.2', '1')
        .play();
    }
  }

  async onPickImage() {
    const image = await Camera.getPhoto({
      quality: 50,
      source: CameraSource.Prompt,
      correctOrientation: true,
      resultType: CameraResultType.Uri,
    });
    this.ionicWeightLogService.saveProfilePic(image.webPath);
  }
}

enum ProgressPeriod {
  Week = 'Week',
  Month = 'Month',
}

export interface ProgressDisplay {
  weight: number;
  weightChange: number;
  fat?: number;
  fatChange?: number;
  muscle?: number;
  muscleChange?: number;
  unitAbbrev: string;
  name: string;
}
