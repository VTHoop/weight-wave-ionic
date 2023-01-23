import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UnitConversionService {
  constructor() {}

  poundsToKilograms(pounds: number): number {
    return pounds * 0.45359237;
  }

  kilogramsToPounds(kilograms: number): number {
    return kilograms * 2.204622622;
  }
}
