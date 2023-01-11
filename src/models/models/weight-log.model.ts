import { WeightUnit } from '../enums/weight-unit.enum';
import firebase from 'firebase/compat';
import Timestamp = firebase.firestore.Timestamp;

export interface WeightLog {
  weightDate: Date;
  creationDate: Date;
  weightAmount: number;
  weightUnit: WeightUnit;
  muscleAmount?: number;
  muscleUnit?: WeightUnit;
  fatAmount?: number;
  fatUnit?: WeightUnit;
}

export interface WeightLogId extends WeightLog {
  id: string;
}

export interface WeightLogResponse {
  weightDate: Timestamp;
  creationDate: Timestamp;
  weightAmount: number;
  weightUnit: WeightUnit;
  muscleAmount?: number;
  muscleUnit?: WeightUnit;
  fatAmount?: number;
  fatUnit?: WeightUnit;
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
