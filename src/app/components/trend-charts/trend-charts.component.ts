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

  plugins = [
    {
      id: 'customCanvasBackgroundColor',
      beforeDraw: (chart, args, options) => {
        const { ctx } = chart;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = options.color || '#99ffff';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      },
    },
    {
      afterDraw: function (chart) {
        if (chart.data.datasets[0].data.length < 1) {
          let ctx = chart.ctx;
          let width = chart.width;
          let height = chart.height;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';
          ctx.font = '30px Roboto';
          ctx.fillText('Coming Soon!', width / 2, height / 2);
          ctx.restore();
        }
      },
    },
  ];

  constructor() {}

  ngOnInit(): void {
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
            this.resetCharts();

            this.createChart(
              'weight-chart',
              labels,
              weightValues,
              'Overall Weight',
              '#3d535c'
            );

            this.createChart('fat-chart', labels, fatValues, 'Fat', '#9fb992');

            this.createChart(
              'muscle-chart',
              labels,
              muscleValues,
              'Muscle',
              '#6d8dab'
            );
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
        pointRadius: 2,
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
        plugins: this.plugins,
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
            padding: {
              left: 20,
              right: 20,
              top: 10,
              bottom: 10,
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: Math.floor(Math.min(...nonNullValues)) - 1,
              max: Math.ceil(Math.max(...nonNullValues)) + 1,
              ticks: {
                color: 'white',
              },
            },
            x: {
              border: {
                display: true,
              },
              grid: {
                display: true,
                drawOnChartArea: true,
                drawTicks: true,
              },
              ticks: {
                maxTicksLimit: 6,
                callback: function (val, index) {
                  const dateVal = new Date(this.getLabelForValue(+val));
                  if (
                    dateVal.getTime() ===
                    new Date(
                      dateVal.getFullYear(),
                      dateVal.getMonth(),
                      1
                    ).getTime()
                  ) {
                    return dateVal.toLocaleString('en-US', { month: 'short' });
                  }
                  return undefined;
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
