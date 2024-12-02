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
  IonicStorageService,
  Settings,
  weightMetrics,
} from 'src/services/ionic-storage.service';
import { MovingAverageService } from 'src/services/moving-average.service';
@Component({
  selector: 'dashboard-tab',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  openSubscriptions: Subscription[] = [];

  settings$: Observable<Settings>;

  progressDisplay$: Observable<ProgressDisplay>;
  weeksToCompare$: BehaviorSubject<number> = new BehaviorSubject(2);

  chartData$: Observable<ChartData>;
  daysToShow$: BehaviorSubject<number> = new BehaviorSubject(30);

  selectedImage: string = '/assets/person-circle-outline.svg';
  isFatLogger: boolean;
  isMuscleLogger: boolean;

  isCurrentWeightPeriodRecorded: boolean;
  isCurrentFatPeriodRecorded: boolean;
  isCurrentMusclePeriodRecorded: boolean;

  loader: HTMLIonLoadingElement;
  isLoading$ = new BehaviorSubject(true);

  constructor(
    private ionicStorageService: IonicStorageService,
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
      this.ionicStorageService.weightLog$,
      this.weeksToCompare$,
      this.ionicStorageService.settings$,
    ]).pipe(
      map(([log, weeksToCompare, settings]) => {
        this.selectedImage = settings.profilePicUrl
          ? settings.profilePicUrl
          : this.selectedImage;

        const {
          currentWeekAverages,
          comparisonWeekAverages,
          isComparisonEntryFound,
          isComparisonWeightFound,
          isComparisonFatFound,
          isComparisonMuscleFound,
        } = this.movingAverageService.getComparisonAverages(
          log,
          weeksToCompare
        );

        this.isFatLogger = settings.isLoggingFat;
        this.isMuscleLogger = settings.isLoggingMuscle;

        this.isCurrentWeightPeriodRecorded =
          !!currentWeekAverages?.avgWeightLbs;
        this.isCurrentFatPeriodRecorded = !!currentWeekAverages?.avgFatLbs;
        this.isCurrentMusclePeriodRecorded =
          !!currentWeekAverages?.avgMuscleLbs;

        return settings.weightMetricDisplay === weightMetrics.pounds.name
          ? {
              weight: currentWeekAverages?.avgWeightLbs,
              weightChange:
                currentWeekAverages?.avgWeightLbs -
                comparisonWeekAverages?.avgWeightLbs,
              fat: currentWeekAverages?.avgFatLbs,
              fatChange:
                currentWeekAverages?.avgFatLbs -
                comparisonWeekAverages?.avgFatLbs,
              muscle: currentWeekAverages?.avgMuscleLbs,
              muscleChange:
                currentWeekAverages?.avgMuscleLbs -
                comparisonWeekAverages?.avgMuscleLbs,
              unitAbbrev: weightMetrics.pounds.abbreviation,
              name: settings.personName,
              isComparisonWeightFound,
              isComparisonFatFound,
              isComparisonMuscleFound,
            }
          : {
              weight: currentWeekAverages?.avgWeightKgs,
              weightChange:
                currentWeekAverages?.avgWeightKgs -
                comparisonWeekAverages?.avgWeightKgs,
              fat: currentWeekAverages?.avgFatKgs,
              fatChange:
                currentWeekAverages?.avgFatKgs -
                comparisonWeekAverages?.avgFatKgs,
              muscle: currentWeekAverages?.avgMuscleKgs,
              muscleChange:
                currentWeekAverages?.avgMuscleKgs -
                comparisonWeekAverages?.avgMuscleKgs,
              unitAbbrev: weightMetrics.kilograms.abbreviation,
              name: settings.personName,
              isComparisonWeightFound,
              isComparisonFatFound,
              isComparisonMuscleFound,
            };

        // this.isLoading$.next(false);
      })
    );
  }

  private getChartData(): Observable<ChartData> {
    return combineLatest([
      this.ionicStorageService.avgWeightLog$,
      this.daysToShow$,
      this.ionicStorageService.settings$,
    ]).pipe(
      map(([log, daysToShow, settings]) => {
        if (!log.allAverages.length) {
          return {
            labels: [],
            weightValues: [],
            fatValues: [],
            muscleValues: [],
          };
        }
        const { labels, weightValues, fatValues, muscleValues } =
          this.prependNullsWhereScaleIsLargerThanData(
            daysToShow,
            log.allAverages
          );
        log.allAverages.slice(daysToShow * -1).map((row) => {
          labels.push(this.dateformat.transform(row.avgWeightDate));
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

    const startDate = log[0].avgWeightDate;

    for (let i = daysToShow; i >= log.length; i--) {
      labels.push(
        this.dateformat.transform(
          new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate() - i
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
