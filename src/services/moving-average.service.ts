import { Injectable } from '@angular/core';
import { AverageWeight, WeightLogId } from 'src/models/models/weight-log.model';

@Injectable({
  providedIn: 'root',
})
export class MovingAverageService {
  constructor() {}

  getComparisonAverages(weightLog: WeightLogId[], numWeeks: number) {
    let currentWeekAverages: AverageWeight;
    let comparisonWeekAverages: AverageWeight;
    const today = new Date();
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    const currentWeekEntries = this.getItemsForNumPreviousDays(
      weightLog,
      endDate,
      6
    );
    if (currentWeekEntries.length) {
      currentWeekAverages = this.calcMovingAverage(
        currentWeekEntries,
        endDate,
        7,
        new Date(currentWeekEntries[0].weightDate)
      );
    }

    const comparisonWeekEndDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - (numWeeks - 1) * 7,
      23,
      59,
      59
    );
    const comparisonWeekEntries = this.getItemsForNumPreviousDays(
      weightLog,
      comparisonWeekEndDate,
      6
    );
    if (comparisonWeekEntries.length) {
      comparisonWeekAverages = this.calcMovingAverage(
        comparisonWeekEntries,
        comparisonWeekEndDate,
        7,
        new Date(comparisonWeekEntries[0].weightDate)
      );
    }
    return {
      currentWeekAverages,
      comparisonWeekAverages,
      isComparisonEntryFound: comparisonWeekAverages !== undefined,
      isComparisonWeightFound:
        comparisonWeekAverages?.avgWeightLbs !== null &&
        !isNaN(comparisonWeekAverages?.avgWeightLbs),
      isComparisonMuscleFound:
        comparisonWeekAverages?.avgMuscleLbs !== null &&
        !isNaN(comparisonWeekAverages?.avgMuscleLbs),
      isComparisonFatFound:
        comparisonWeekAverages?.avgFatLbs !== null &&
        !isNaN(comparisonWeekAverages?.avgFatLbs),
    };
  }

  calcMovingAverageForEverything = (
    array: WeightLogId[],
    movingAvgAmount: number
  ): MovingAverageData => {
    if (array.length === 0) {
      return {
        //@ts-ignore
        lowestWeightAverage: {},
        allAverages: [],
      };
    }

    let allAverages = [];

    let lowestWeightAverage = this.calcMovingAverage(
      array,
      new Date(array[0].weightDate),
      movingAvgAmount,
      new Date(array[0].weightDate)
    );

    const earliestDate = new Date(array[0].weightDate);
    const today = new Date();

    for (
      let iDate = new Date(array[0].weightDate);
      iDate < today;
      iDate.setDate(iDate.getDate() + 1)
    ) {
      const movingAverageDate = new Date(
        iDate.getFullYear(),
        iDate.getMonth(),
        iDate.getDate(),
        23,
        59,
        59
      );
      const weightedWeight = this.calcMovingAverage(
        array,
        movingAverageDate,
        movingAvgAmount,
        earliestDate
      );

      if (weightedWeight.avgWeightLbs < lowestWeightAverage.avgWeightLbs) {
        lowestWeightAverage = weightedWeight;
      }

      allAverages.push(weightedWeight);
    }
    return {
      lowestWeightAverage,
      allAverages,
    };
  };

  calcMovingAverage = (
    array: WeightLogId[],
    calcEndDate: Date,
    movingAvgAmount: number,
    earliestDate: Date
  ): AverageWeight => {
    let lastNumDays = this.getItemsForNumPreviousDays(
      array,
      calcEndDate,
      movingAvgAmount
    );
    // if no values have been entered during that period, increase scope until a value is found
    while (
      lastNumDays.length === 0 &&
      movingAvgAmount <
        Math.ceil(
          (calcEndDate.getTime() - earliestDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
    ) {
      movingAvgAmount = movingAvgAmount + 1;
      lastNumDays = this.getItemsForNumPreviousDays(
        array,
        calcEndDate,
        movingAvgAmount
      );
    }
    const avgs = this.avgAllValuesInArray(lastNumDays);

    return {
      avgWeightDate: new Date(calcEndDate.getTime()),
      avgWeightLbs: avgs.weightLbsAvg,
      avgFatLbs: avgs.fatLbsAvg,
      avgMuscleLbs: avgs.muscleLbsAvg,
      avgWeightKgs: avgs.weightKgsAvg,
      avgMuscleKgs: avgs.muscleKgsAvg,
      avgFatKgs: avgs.fatKgsAvg,
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
      endDate.getDate() - prevDayscount,
      0,
      0,
      0
    );
    return array.filter((entry) => {
      const weightDate = new Date(entry.weightDate);
      return (
        weightDate.getTime() >= begDate.getTime() &&
        weightDate.getTime() <= endDate.getTime()
      );
    });
  };

  avgAllValuesInArray = (array: WeightLogId[]): WeightAverages => {
    let weightLbsSum = 0,
      muscleLbsSum = 0,
      fatLbsSum = 0,
      weightKgsSum = 0,
      muscleKgsSum = 0,
      fatKgsSum = 0,
      muscleCount = 0,
      fatCount = 0;

    for (let i in array) {
      weightLbsSum += array[i].weightLbs;
      weightKgsSum += array[i].weightKgs;

      if (array[i].muscleLbs) {
        muscleLbsSum += array[i].muscleLbs;
        muscleKgsSum += array[i].muscleKgs;
        muscleCount++;
      }

      if (array[i].fatLbs) {
        fatLbsSum += array[i].fatLbs;
        fatKgsSum += array[i].fatKgs;
        fatCount++;
      }
    }
    return {
      weightLbsAvg: weightLbsSum / array.length,
      weightKgsAvg: weightKgsSum / array.length,
      muscleLbsAvg: muscleLbsSum / muscleCount,
      muscleKgsAvg: muscleKgsSum / muscleCount,
      fatLbsAvg: fatLbsSum / fatCount,
      fatKgsAvg: fatKgsSum / fatCount,
    };
  };
}

interface WeightAverages {
  weightLbsAvg: number;
  fatLbsAvg: number;
  muscleLbsAvg: number;
  weightKgsAvg: number;
  muscleKgsAvg: number;
  fatKgsAvg: number;
}

export interface MovingAverageData {
  lowestWeightAverage: AverageWeight;
  allAverages: AverageWeight[];
}
