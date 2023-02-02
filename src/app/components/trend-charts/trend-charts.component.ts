import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { Subscription, BehaviorSubject, Observable, tap } from 'rxjs';
import {
  IonicWeightLogService,
  Settings,
} from 'src/services/ionic-weight-log.service';

@Component({
  selector: 'app-trend-charts',
  templateUrl: './trend-charts.component.html',
  styleUrls: ['./trend-charts.component.scss'],
  providers: [DatePipe],
})
export class TrendChartsComponent implements OnInit {
  openSubscriptions: Subscription[] = [];

  @Input() chartData$: Observable<ChartData>;
  @Input() isFatLogger: boolean;
  @Input() isMuscleLogger: boolean;

  @Output() comparisonPeriodChanged = new EventEmitter<number>();

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

  constructor(private ionicWeightLogService: IonicWeightLogService) {}

  ngOnInit(): void {
    this.settings$ = this.ionicWeightLogService.settings$;
    this.createCharts();
  }

  changeFilter(filterValue: ChartSpan): void {
    switch (filterValue) {
      case ChartSpan.Month:
        this.comparisonPeriodChanged.emit(30);
        this.selectedChartSpan = ChartSpan.Month;
        break;
      case ChartSpan.Quarter:
        this.comparisonPeriodChanged.emit(120);
        this.selectedChartSpan = ChartSpan.Quarter;
        break;
      case ChartSpan.Year:
        this.comparisonPeriodChanged.emit(365);
        this.selectedChartSpan = ChartSpan.Year;
        break;
    }
  }

  private createCharts = () => {
    this.openSubscriptions.push(
      this.chartData$
        .pipe(
          tap((chartData) => {
            const { labels, weightValues, fatValues, muscleValues } = chartData;
            if (chartData.labels.length) {
              this.resetCharts();

              this.createChart(
                'weight-chart',
                labels,
                weightValues,
                'Overall Weight',
                '#3d535c'
              );

              this.createChart(
                'fat-chart',
                labels,
                fatValues,
                'Fat',
                '#9fb992'
              );

              this.createChart(
                'muscle-chart',
                labels,
                muscleValues,
                'Muscle',
                '#6d8dab'
              );
            }
          })
        )
        .subscribe()
    );
  };

  private getChartDataAttributes = (
    labels: (string | null)[],
    values: (number | null)[]
  ) => ({
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

  private resetCharts = () => {
    this.resetChart('weight-chart');
    this.resetChart('fat-chart');
    this.resetChart('muscle-chart');
  };

  private resetChart = (chartName: string) => {
    const chart = Chart.getChart(chartName);
    if (chart !== undefined) {
      chart.destroy();
    }
  };

  private createChart = (
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
        data: this.getChartDataAttributes(labels, values),
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

export interface ChartData {
  labels: string[];
  weightValues: number[];
  fatValues: number[];
  muscleValues: number[];
}
