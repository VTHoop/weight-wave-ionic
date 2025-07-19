import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { EChartsOption } from 'echarts';
import { Observable, Subscription, tap } from 'rxjs';
import { ChartData } from '../trend-charts/trend-charts.component';

@Component({
  selector: 'app-trend-chart-echarts',
  templateUrl: './trend-chart-echarts.component.html',
  styleUrls: ['./trend-chart-echarts.component.scss'],
})
export class TrendChartEchartsComponent implements OnInit, OnDestroy {
  openSubscriptions: Subscription[] = [];

  selectedChartSpan = ChartSpan.Month;
  public ChartSpan: any = ChartSpan;

  @Input() chartData$: Observable<ChartData>;
  @Input() isFatLogger: boolean;
  @Input() isMuscleLogger: boolean;

  @Output() comparisonPeriodChanged = new EventEmitter<number>();
  weightChartOptions: EChartsOption;
  fatChartOptions: EChartsOption;
  muscleChartOptions: EChartsOption;

  constructor() {}

  ngOnInit() {
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
            this.weightChartOptions = this.createChart(
              labels,
              weightValues,
              'Overall Weight',
              '#3d535c'
            );
            this.fatChartOptions = this.createChart(
              labels,
              fatValues,
              'Fat',
              '#9fb992'
            );
            this.muscleChartOptions = this.createChart(
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

  private createChart = (
    labels: string[],
    values: number[],
    title: string,
    backgroundColor: string
  ): EChartsOption => {
    const nonNullValues: number[] = values.filter((value) => value !== null);

    return {
      title: {
        show: true,
        text: title,
        textStyle: { color: '#fff' },
        left: 0,
        top: 0,
        padding: 20,
      },

      color: '#ffffff',
      backgroundColor: backgroundColor,
      xAxis: {
        axisLabel: {
          interval: function (i, val) {
            const dateVal = new Date(val);
            const isTodayEvenMonth = new Date().getMonth() % 2 === 0;
            if (
              dateVal.getTime() ===
                new Date(
                  dateVal.getFullYear(),
                  dateVal.getMonth(),
                  1
                ).getTime() &&
              (labels.length > 140
                ? isTodayEvenMonth
                  ? dateVal.getMonth() % 2 === 0
                  : dateVal.getMonth() % 2 === 1
                : true)
            ) {
              return true;
            }
            return false;
          },
          formatter: function (value, index) {
            return `${value.slice(0, 3)} '${value.slice(-2)}`;
          },
        },
        axisLine: {
          lineStyle: { color: '#fff' },
        },
        type: 'category',
        data: labels,
      },
      yAxis: {
        axisLine: {
          lineStyle: { color: '#fff' },
        },
        type: 'value',
        min: Math.floor(Math.min(...nonNullValues)) - 1,
        max: Math.ceil(Math.max(...nonNullValues)) + 1,
      },
      series: [
        {
          data: values,
          type: 'line',
          smooth: true,
        },
      ],
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
