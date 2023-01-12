import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AverageWeight, WeightLogId } from 'src/models/models/weight-log.model';

@Injectable({
  providedIn: 'root',
})
export class MovingAverageService {
  constructor() {}

  getWeekByWeekAverage(
    weightLog$: Observable<WeightLogId[]>,
    numWeeks: number,
    endDate: Date = new Date()
  ): Observable<AverageWeight[]> {
    const originalEndDate = endDate;
    return weightLog$.pipe(
      // shareReplay(1),
      map((log) => {
        const weekAverages: AverageWeight[] = [];
        for (let i = 0; i < numWeeks; i++) {
          const week = this.getItemsForNumPreviousDays(log, endDate, 6);
          weekAverages.push(this.calcMovingAverage(week, endDate, 7));

          endDate = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate() - 7
          );
        }
        endDate = originalEndDate;
        return weekAverages;
      })
    );
  }

  calcMovingAverageForEverything = (
    array: WeightLogId[],
    movingAvgAmount: number
  ): AverageWeight[] => {
    //TODO: Need to handle situation where user skips more days than moving average
    let weightedAvgs = [];
    for (
      let iDate = new Date(array[0].weightDate);
      iDate < array[array.length - 1].weightDate;
      iDate.setDate(iDate.getDate() + 1)
    ) {
      const weightedWeight = this.calcMovingAverage(
        array,
        iDate,
        movingAvgAmount
      );
      weightedAvgs.push(weightedWeight);
    }
    return weightedAvgs;
  };

  calcMovingAverage = (
    array: WeightLogId[],
    calcEndDate: Date,
    movingAvgAmount: number
  ): AverageWeight => {
    const lastNumDays = this.getItemsForNumPreviousDays(
      array,
      calcEndDate,
      movingAvgAmount
    );
    const avgs = this.avgAllValuesInArray(lastNumDays);

    return {
      avgWeightDate: new Date(calcEndDate.getTime()),
      avgWeightAmount: avgs.weightAvg,
      avgFatAmount: avgs.fatAvg,
      avgMuscleAmount: avgs.muscleAvg,
    };
  };

  getItemsForNumPreviousDays = (
    array: WeightLogId[],
    endDate: Date,
    prevDayscount: number
  ): WeightLogId[] => {
    const begDate: Date = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - prevDayscount
    );
    return array.filter(
      (entry) =>
        entry.weightDate.getTime() >= begDate.getTime() &&
        entry.weightDate.getTime() <= endDate.getTime()
    );
  };

  avgAllValuesInArray = (array: WeightLogId[]): WeightAverages => {
    let weightSum = 0,
      muscleSum = 0,
      fatSum = 0;

    for (let i in array) {
      weightSum += array[i].weightAmount;
      muscleSum += array[i].muscleAmount || 0;
      fatSum += array[i].fatAmount || 0;
    }
    return {
      weightAvg: weightSum / array.length,
      muscleAvg: muscleSum / array.length,
      fatAvg: fatSum / array.length,
    };
  };
}

interface WeightAverages {
  weightAvg: number;
  fatAvg: number;
  muscleAvg: number;
}
