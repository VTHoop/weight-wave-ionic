import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  Subscription,
  tap,
} from 'rxjs';
import { ChartData } from 'src/app/components/trend-charts/trend-charts.component';
import { ProgressDisplay } from 'src/app/components/week-progress/week-progress.component';
import { AverageWeight } from 'src/models/models/weight-log.model';
import {
  IonicWeightLogService,
  weightMetrics,
} from 'src/services/ionic-weight-log.service';
import { MovingAverageService } from 'src/services/moving-average.service';
@Component({
  selector: 'dashboard-tab',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  openSubscriptions: Subscription[] = [];

  progressDisplay$: Observable<ProgressDisplay>;
  weeksToCompare$: BehaviorSubject<number> = new BehaviorSubject(2);

  chartData$: Observable<ChartData>;
  daysToShow$: BehaviorSubject<number> = new BehaviorSubject(30);

  selectedImage: string = '/assets/person-circle-outline.svg';
  isFatLogger: boolean;
  isMuscleLogger: boolean;

  loader: HTMLIonLoadingElement;
  isLoading$ = new BehaviorSubject(true);

  constructor(
    private weightLogService: IonicWeightLogService,
    private movingAverageService: MovingAverageService,
    private loadingCtrl: LoadingController,
    private dateformat: DatePipe
  ) {}

  ngOnInit() {
    // await this.showLoader();

    this.progressDisplay$ = this.getProgressDisplayData();
    this.chartData$ = this.getChartData();
    // this.dismissLoader();
  }

  private getProgressDisplayData(): Observable<ProgressDisplay> {
    return combineLatest([
      this.weightLogService.weightLog$,
      this.weeksToCompare$,
      this.weightLogService.settings$,
    ]).pipe(
      map(([log, weeksToCompare, settings]) => {
        this.selectedImage = settings.profilePicUrl
          ? settings.profilePicUrl
          : this.selectedImage;
        const changeOverTime = this.movingAverageService.getWeekByWeekAverage(
          log,
          weeksToCompare,
          new Date()
        );

        this.isFatLogger = settings.isLoggingFat;
        this.isMuscleLogger = settings.isLoggingMuscle;

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

        // this.isLoading$.next(false);
        return progressDisplay;
      })
    );
  }

  private getChartData(): Observable<ChartData> {
    return combineLatest([
      this.weightLogService.avgWeightLog$,
      this.daysToShow$,
      this.weightLogService.settings$,
    ]).pipe(
      map(([log, daysToShow, settings]) => {
        const { labels, weightValues, fatValues, muscleValues } =
          this.prependNullsWhereScaleIsLargerThanData(
            daysToShow,
            log.allAverages
          );

        log.allAverages.slice(daysToShow * -1).map((row) => {
          labels.push(this.dateformat.transform(row.avgWeightDate, 'MMM d'));
          if (settings.weightMetricDisplay === weightMetrics.pounds.name) {
            weightValues.push(row.avgWeightLbs);
            if (row.avgFatLbs) {
              fatValues.push(row.avgFatLbs);
            }
            if (row.avgMuscleLbs) {
              muscleValues.push(row.avgMuscleLbs);
            }
          } else {
            weightValues.push(row.avgWeightKgs);
            if (row.avgFatKgs) {
              fatValues.push(row.avgFatKgs);
            }
            if (row.avgMuscleKgs) {
              muscleValues.push(row.avgMuscleKgs);
            }
          }
        });
        return {
          labels,
          weightValues,
          fatValues,
          muscleValues,
        };
      })
    );
  }

  private prependNullsWhereScaleIsLargerThanData = (
    daysToShow: number,
    log: AverageWeight[]
  ) => {
    const labels: (string | null)[] = [];
    const weightValues: (number | null)[] = [];
    const fatValues: (number | null)[] = [];
    const muscleValues: (number | null)[] = [];

    for (let i = daysToShow; i >= log.length; i--) {
      labels.push(
        this.dateformat.transform(
          new Date(
            log[0].avgWeightDate.getFullYear(),
            log[0].avgWeightDate.getMonth(),
            log[0].avgWeightDate.getDate() - i
          )
        )
      );
      weightValues.push(null);
      fatValues.push(null);
      muscleValues.push(null);
    }
    return {
      labels,
      weightValues,
      fatValues,
      muscleValues,
    };
  };

  async showLoader() {
    this.loader = await this.loadingCtrl.create({
      duration: 500, //this doesnt do anything right now
    });

    this.loader.present();
  }

  dismissLoader() {
    this.openSubscriptions.push(
      this.isLoading$
        .pipe(
          tap((isLoading) => {
            if (!isLoading) {
              this.loader.dismiss();
            }
          })
        )
        .subscribe()
    );
  }

  onSummaryPeriodChanged(value: number) {
    this.weeksToCompare$.next(value);
  }

  onChartPeriodChanged(value: number) {
    this.daysToShow$.next(value);
  }

  ngOnDestroy(): void {
    this.openSubscriptions.forEach((subscription) =>
      subscription.unsubscribe()
    );
  }
}
