import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { Subscription, map } from 'rxjs';
import { AverageWeight } from 'src/models/models/weight-log.model';
import { WeightLogService } from 'src/services/weight-log.service';

@Component({
  selector: 'app-trend-charts',
  templateUrl: './trend-charts.component.html',
  styleUrls: ['./trend-charts.component.scss'],
  providers: [DatePipe],
})
export class TrendChartsComponent implements OnInit {
  openSubscriptions: Subscription[] = [];
  daysToShow: number = 30;

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
    private weightLogService: WeightLogService,
    private dateformat: DatePipe
  ) {}

  ngOnInit(): void {
    this.createCharts();
  }

  createCharts = () => {
    this.openSubscriptions.push(
      this.weightLogService.avgWeightLog$
        .pipe(
          map((log) => {
            this.resetChart('weight-chart');
            this.resetChart('fat-chart');
            this.resetChart('muscle-chart');
            const labels: (string | null)[] = [];
            const weightValues: (number | null)[] = [];
            const fatValues: (number | null)[] = [];
            const muscleValues: (number | null)[] = [];

            for (let i = this.daysToShow; i >= log.length; i--) {
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

            log.map((row) => {
              labels.push(this.dateformat.transform(row.avgWeightDate));
              weightValues.push(row.avgWeightAmount);
              if (row.avgFatAmount) {
                fatValues.push(row.avgFatAmount);
              }
              if (row.avgMuscleAmount) {
                muscleValues.push(row.avgMuscleAmount);
              }
            });
            this.createChart(
              'weight-chart',
              labels,
              weightValues,
              'rgb(75, 192, 192)',
              'Overall Weight',
              '#3d535c'
            );
            this.createChart(
              'fat-chart',
              labels,
              fatValues,
              'rgb(192, 75, 192)',
              'Fat',
              '#9fb992'
            );
            this.createChart(
              'muscle-chart',
              labels,
              muscleValues,
              'rgb(192, 192, 75)',
              'Muscle',
              '#6d8dab'
            );
          })
        )
        .subscribe()
    );
  };

  getChartData = (
    labels: (string | null)[],
    values: (number | null)[],
    color: string
  ) => ({
    labels: labels,
    datasets: [
      {
        data: values,
        fill: false,
        backgroundColor: '#ffffff',
        borderColor: '#ffffff',
        tension: 0.5,
      },
    ],
  });

  sortChartData = (log: AverageWeight[]) =>
    log.sort(
      (a, b) =>
        //@ts-ignore
        a.weightDate - b.weightDate
    );

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
    color: string,
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
        data: this.getChartData(labels, values, color),
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
                  // return index % 5 === 0 ? labels[+val] : '';

                  index === 0 ||
                    index === labels.length - 1 ||
                    index === Math.ceil((labels.length - 1) / 2);
                },
                color: 'white',
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
