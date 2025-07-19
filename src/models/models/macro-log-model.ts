export interface MacroLog {
  logDate: Date;
  creationDate: Date;
  pnProtein?: number;
  pnFat?: number;
  pnCarbs?: number;
  pnAlcohol?: number;
  pnVeggies?: number;
}

export interface MacroLogId extends MacroLog {
  id: string;
}
