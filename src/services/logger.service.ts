import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private level: LogLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;

  error(message: string, data?: any) {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, data);
    }
  }

  warn(message: string, data?: any) {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, data);
    }
  }

  info(message: string, data?: any) {
    if (this.level >= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, data);
    }
  }

  debug(message: string, data?: any) {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }

  // Allow runtime level changes for debugging
  setLevel(level: LogLevel) {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}