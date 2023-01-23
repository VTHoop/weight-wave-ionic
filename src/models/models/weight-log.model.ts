import firebase from 'firebase/compat';
import Timestamp = firebase.firestore.Timestamp;

export interface WeightLog {
  weightDate: Date;
  creationDate: Date;
  weightAmount?: number;
  muscleAmount?: number;
  fatAmount?: number;
  // TODO: Make non-optional
  weightLbs?: number;
  muscleLbs?: number;
  fatLbs?: number;
  // TODO: Make non-optional
  weightKgs?: number;
  muscleKgs?: number;
  fatKgs?: number;
}

export interface WeightLogId extends WeightLog {
  id: string;
}

export interface WeightLogResponse {
  weightDate: Timestamp;
  creationDate: Timestamp;
  weightAmount: number;
  muscleAmount?: number;
  fatAmount?: number;
}

export interface WeightLogResponseId extends WeightLogResponse {
  id: string;
}

export interface AverageWeight {
  avgWeightDate: Date;
  avgWeightAmount: number;
  avgMuscleAmount?: number;
  avgFatAmount?: number;
}
