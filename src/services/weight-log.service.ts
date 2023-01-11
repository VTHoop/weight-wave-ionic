import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import {
  AverageWeight,
  WeightLogId,
  WeightLogResponse,
  WeightLogResponseId,
} from '../models/models/weight-log.model';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root',
})
export class WeightLogService {
  avgWeightLog$: Observable<AverageWeight[]>;
  weightLog$: Observable<WeightLogId[]>;

  _firebaseCollection = 'weightLog';

  constructor(private afs: AngularFirestore) {
    this.weightLog$ = this.getWeightLogEntries().pipe(shareReplay(1));
    this.avgWeightLog$ = this.weightLog$.pipe(
      map((log) => calcMovingAverageForEverything(log, 7))
    );
  }

  getWeightLogCollection(
    field: string,
    id: string
  ): AngularFirestoreCollection<WeightLogResponse> {
    if (!field || !id) {
      return this.afs.collection(this._firebaseCollection);
    } else {
      return this.afs.collection(this._firebaseCollection, (ref) =>
        ref.where(field, '==', id)
      );
    }
  }

  getWeightLogDoc(id: string): AngularFirestoreDocument<WeightLogResponse> {
    return this.afs.doc<WeightLogResponse>(`${this._firebaseCollection}/${id}`);
  }

  ///////////
  // WeightLog
  // READ one, READ all
  ///////////
  getWeightLogEntries(): Observable<WeightLogId[]> {
    return this.afs
      .collection('weightLog', (ref) => ref.orderBy('weightDate', 'asc'))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as WeightLogResponse;
            const id = a.payload.doc.id;
            return {
              id,
              ...data,
              creationDate: new Date(data.creationDate.seconds * 1000),
              weightDate: new Date(data.weightDate.seconds * 1000),
            };
          })
        )
      );
  }

  getWeightLogEntryById(id: string): Observable<WeightLogResponseId> {
    return this.getWeightLogDoc(id)
      .snapshotChanges()
      .pipe(
        map((a) => {
          const data = a.payload.data() as WeightLogResponse;
          const userId = a.payload.id;
          return { id: userId, ...data };
        })
      );
  }

  addWeightLogEntry(data: any) {
    return this.afs
      .collection(`${this._firebaseCollection}`)
      .add(Object.assign({}, data))
      .then(() => 'Entry Added Successfully');
  }

  getWeekByWeekAverage(
    numWeeks: number,
    endDate: Date = new Date()
  ): Observable<AverageWeight[]> {
    const originalEndDate = endDate;
    return this.weightLog$.pipe(
      // shareReplay(1),
      map((log) => {
        console.log(endDate);
        const weekAverages: AverageWeight[] = [];
        for (let i = 0; i < numWeeks; i++) {
          const week = getItemsForNumPreviousDays(log, endDate, 6);
          console.log(week);
          weekAverages.push(calcMovingAverage(week, endDate, 7));

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
}

const calcMovingAverageForEverything = (
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
    const weightedWeight = calcMovingAverage(array, iDate, movingAvgAmount);
    weightedAvgs.push(weightedWeight);
  }
  return weightedAvgs;
};

const calcMovingAverage = (
  array: WeightLogId[],
  calcEndDate: Date,
  movingAvgAmount: number
): AverageWeight => {
  const lastNumDays = getItemsForNumPreviousDays(
    array,
    calcEndDate,
    movingAvgAmount
  );
  const avgs = avgAllValuesInArray(lastNumDays);

  return {
    avgWeightDate: new Date(calcEndDate.getTime()),
    avgWeightAmount: avgs.weightAvg,
    avgFatAmount: avgs.fatAvg,
    avgMuscleAmount: avgs.muscleAvg,
  };
};

const getItemsForNumPreviousDays = (
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

const avgAllValuesInArray = (array: WeightLogId[]): WeightAverages => {
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

interface WeightAverages {
  weightAvg: number;
  fatAvg: number;
  muscleAvg: number;
}
