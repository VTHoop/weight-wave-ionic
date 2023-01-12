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
import { MovingAverageService } from './moving-average.service';

@Injectable({
  providedIn: 'root',
})
export class WeightLogService {
  avgWeightLog$: Observable<AverageWeight[]>;
  weightLog$: Observable<WeightLogId[]>;

  _firebaseCollection = 'weightLog';

  constructor(
    private afs: AngularFirestore,
    movingAverageService: MovingAverageService
  ) {
    this.weightLog$ = this.getWeightLogEntries().pipe(shareReplay(1));
    this.avgWeightLog$ = this.weightLog$.pipe(
      map((log) => movingAverageService.calcMovingAverageForEverything(log, 7))
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
}
