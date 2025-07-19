export interface WeightLog {
  weightDate: Date;
  creationDate: Date;
  weightLbs: number;
  muscleLbs?: number;
  fatLbs?: number;
  weightKgs: number;
  muscleKgs?: number;
  fatKgs?: number;
}

export interface WeightLogId extends WeightLog {
  id: string;
}

export interface AverageWeight {
  avgWeightDate: Date;
  avgWeightLbs: number;
  avgMuscleLbs?: number;
  avgFatLbs?: number;
  avgWeightKgs: number;
  avgMuscleKgs?: number;
  avgFatKgs?: number;
}
