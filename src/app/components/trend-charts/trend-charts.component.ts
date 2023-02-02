import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import {
  Subscription,
  map,
  BehaviorSubject,
  combineLatest,
  Observable,
} from 'rxjs';
import { AverageWeight } from 'src/models/models/weight-log.model';
import {
  IonicWeightLogService,
  Settings,
  weightMetrics,
} from 'src/services/ionic-weight-log.service';

@Component({
  selector: 'app-trend-charts',
  templateUrl: './trend-charts.component.html',
  styleUrls: ['./trend-charts.component.scss'],
  providers: [DatePipe],
})
export class TrendChartsComponent implements OnInit {
  openSubscriptions: Subscription[] = [];
  daysToShow$: BehaviorSubject<number> = new BehaviorSubject(30);
  settings$: Observable<Settings>;
  selectedChartSpan = ChartSpan.Month;
  public ChartSpan: any = ChartSpan;

  plugin = {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart, args, options) => {
      const { ctx } = chart;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = options.color || '#99ffff';
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  constructor(
    private ionicWeightLogService: IonicWeightLogService,
    private dateformat: DatePipe
  ) {}

  ngOnInit(): void {
    this.settings$ = this.ionicWeightLogService.settings$;
    this.createCharts();
  }

  changeFilter(filterValue: ChartSpan): void {
    switch (filterValue) {
      case ChartSpan.Month:
        this.daysToShow$.next(30);
        this.selectedChartSpan = ChartSpan.Month;
        break;
      case ChartSpan.Quarter:
        this.daysToShow$.next(120);
        this.selectedChartSpan = ChartSpan.Quarter;
        break;
      case ChartSpan.Year:
        this.daysToShow$.next(365);
        this.selectedChartSpan = ChartSpan.Year;
        break;
    }
  }

  createCharts = () => {
    this.openSubscriptions.push(
      combineLatest([
        this.ionicWeightLogService.avgWeightLog$,
        this.daysToShow$,
        this.settings$,
      ])
        .pipe(
          map(([log, daysToShow, settings]) => {
            if (log.allAverages.length) {
              this.resetCharts();

              const { labels, weightValues, fatValues, muscleValues } =
                this.prependNullsWhereScaleIsLargerThanData(
                  daysToShow,
                  log.allAverages
                );

              log.allAverages.slice(daysToShow * -1).map((row) => {
                labels.push(
                  this.dateformat.transform(row.avgWeightDate, 'MMM d')
                );
                if (
                  settings.weightMetricDisplay === weightMetrics.pounds.name
                ) {
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

              this.createChart(
                'weight-chart',
                labels,
                weightValues,
                'Overall Weight',
                '#3d535c'
              );

              if (settings.isLoggingFat) {
                this.createChart(
                  'fat-chart',
                  labels,
                  fatValues,
                  'Fat',
                  '#9fb992'
                );
              }

              if (settings.isLoggingMuscle) {
                this.createChart(
                  'muscle-chart',
                  labels,
                  muscleValues,
                  'Muscle',
                  '#6d8dab'
                );
              }
            }
          })
        )
        .subscribe()
    );
  };

  getChartData = (labels: (string | null)[], values: (number | null)[]) => ({
    labels: labels,
    datasets: [
      {
        data: values,
        fill: false,
        backgroundColor: '#ffffff',
        borderColor: '#ffffff',
        tension: 0.5,
        pointRadius: 1,
      },
    ],
  });

  sortChartData = (log: AverageWeight[]) =>
    log.sort(
      (a, b) =>
        //@ts-ignore
        a.weightDate - b.weightDate
    );

  resetCharts = () => {
    this.resetChart('weight-chart');
    this.resetChart('fat-chart');
    this.resetChart('muscle-chart');
  };

  resetChart = (chartName: string) => {
    const chart = Chart.getChart(chartName);
    if (chart !== undefined) {
      chart.destroy();
    }
  };

  createChart = (
    name: string,
    labels: (string | null)[],
    values: (number | null)[],
    title: string,
    backgroundColor: string
  ): void => {
    //@ts-ignore
    const nonNullValues: number[] = values.filter((value) => value !== null);
    new Chart(
      //@ts-ignore
      document.getElementById(name),
      {
        type: 'line',
        data: this.getChartData(labels, values),
        plugins: [this.plugin],
        options: {
          plugins: {
            title: {
              display: true,
              text: title,
              align: 'start',
              color: 'white',
              padding: { bottom: 15 },
              font: {
                size: 16,
              },
            },
            legend: {
              display: false,
            },
            customCanvasBackgroundColor: {
              color: backgroundColor,
            },
          },
          layout: {
            padding: 20,
          },
          responsive: true,
          scales: {
            y: {
              min: Math.floor(Math.min(...nonNullValues)),
              max: Math.ceil(Math.max(...nonNullValues)),
              ticks: {
                color: 'white',
              },
            },
            x: {
              border: {
                display: false,
              },
              grid: {
                display: false,
                drawOnChartArea: false,
                drawTicks: false,
              },
              ticks: {
                callback: function (val, index) {
                  // Hide every 2nd tick label
                  index % 5 === 0 ? this.getLabelForValue(+val) : '';
                },
                color: 'white',
                minRotation: 0,
                maxRotation: 0,
              },
            },
          },
        },
      }
    );
  };

  prependNullsWhereScaleIsLargerThanData = (
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

  ngOnDestroy(): void {
    this.openSubscriptions.forEach((subscription) =>
      subscription.unsubscribe()
    );
  }
}

enum ChartSpan {
  Month,
  Quarter,
  Year,
}
