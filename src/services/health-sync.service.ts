import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { IonicStorageService } from './ionic-storage.service';
import { UnitConversionService } from './unit-conversion.service';
import { LoggerService } from './logger.service';
import { WeightLogId } from 'src/models/models/weight-log.model';
import { v4 as uuidv4 } from 'uuid';

declare var navigator: any;
declare var cordova: any;

export interface HealthSyncStatus {
  isInProgress: boolean;
  totalEntries?: number;
  processedEntries?: number;
  newEntries?: number;
  duplicatesSkipped?: number;
  lastSyncDate?: Date;
  error?: string;
}

export interface HealthDataPoint {
  startDate: Date;
  endDate: Date;
  value: number;
  unit: string;
  sourceName?: string;
  dataType: string;
}

@Injectable({
  providedIn: 'root'
})
export class HealthSyncService {
  private _syncStatus$ = new BehaviorSubject<HealthSyncStatus>({ isInProgress: false });
  private readonly DUPLICATE_TOLERANCE = 0.1; // 0.1 unit tolerance for duplicate detection
  private readonly MAX_SYNC_DAYS = 730; // 2 years max
  private readonly BATCH_SIZE = 50; // Process in batches

  constructor(
    private storageService: IonicStorageService,
    private unitConversion: UnitConversionService,
    private logger: LoggerService
  ) {
    this.loadLastSyncDate();
  }

  get syncStatus$() {
    return this._syncStatus$.asObservable();
  }

  async isHealthAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      this.logger.debug('Health check: Not on native platform');
      return false;
    }

    try {
      return new Promise((resolve) => {
        // Try cordova.plugins.health first (correct API)
        if (cordova?.plugins?.health) {
          this.logger.debug('Health check: cordova.plugins.health found, checking availability...');
          cordova.plugins.health.isAvailable(
            () => {
              this.logger.debug('Health check: Health services available via cordova.plugins.health');
              resolve(true);
            },
            (error: any) => {
              this.logger.warn('Health check: Health services not available via cordova.plugins.health:', error);
              resolve(false);
            }
          );
        } else if (navigator.health) {
          this.logger.debug('Health check: navigator.health found, checking availability...');
          navigator.health.isAvailable(
            () => {
              this.logger.debug('Health check: Health services available via navigator.health');
              resolve(true);
            },
            (error: any) => {
              this.logger.warn('Health check: Health services not available via navigator.health:', error);
              resolve(false);
            }
          );
        } else {
          this.logger.error('Health check: Neither cordova.plugins.health nor navigator.health found - plugin not loaded?');
          resolve(false);
        }
      });
    } catch (error) {
      this.logger.error('Health availability check failed with exception:', error);
      return false;
    }
  }

  // New method to get detailed health service information
  async getHealthServiceInfo(): Promise<any> {
    this.logger.debug('=== Health Service Diagnostic Info ===');
    this.logger.debug('Platform info:', {
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      isAndroid: Capacitor.getPlatform() === 'android',
      isIOS: Capacitor.getPlatform() === 'ios'
    });

    this.logger.debug('Cordova health object:', {
      cordovaExists: !!cordova,
      pluginsExists: !!cordova?.plugins,
      healthExists: !!cordova?.plugins?.health,
      type: typeof cordova?.plugins?.health
    });

    this.logger.debug('Navigator health object:', {
      exists: !!navigator.health,
      type: typeof navigator.health,
      methods: navigator.health ? Object.getOwnPropertyNames(navigator.health) : 'N/A'
    });

    const healthPlugin = cordova?.plugins?.health || navigator.health;
    if (healthPlugin) {
      try {
        // Try to get more info about what's available
        return new Promise((resolve) => {
          healthPlugin.isAvailable(
            (result: any) => {
              this.logger.debug('Health availability result:', result);
              resolve({ available: true, result });
            },
            (error: any) => {
              this.logger.debug('Health availability error:', error);
              resolve({ available: false, error });
            }
          );
        });
      } catch (error) {
        this.logger.error('Error calling health.isAvailable:', error);
        return { available: false, exception: error };
      }
    }

    return { available: false, reason: 'Health plugin not found' };
  }

  async requestHealthPermissions(): Promise<boolean> {
    if (!await this.isHealthAvailable()) {
      throw new Error('Health services not available on this device');
    }

    return new Promise((resolve, reject) => {
      const permissions = {
        read: ['weight', 'fat_percentage']
      };

      const healthPlugin = cordova?.plugins?.health || navigator.health;
      healthPlugin.requestAuthorization(
        permissions,
        () => {
          this.logger.info('Health permissions granted');
          resolve(true);
        },
        (error: any) => {
          this.logger.warn('Health permissions denied:', error);
          reject(new Error('Health permissions were denied'));
        }
      );
    });
  }

  async syncWeightData(): Promise<void> {
    if (this._syncStatus$.value.isInProgress) {
      throw new Error('Sync already in progress');
    }

    this.updateSyncStatus({ isInProgress: true, error: undefined });

    try {
      // Check availability and permissions
      if (!await this.isHealthAvailable()) {
        throw new Error('Health services not available');
      }

      await this.requestHealthPermissions();

      // Get existing weight log for deduplication
      const existingEntries = await this.getExistingWeightEntries();
      
      // Query both weight and fat percentage data
      const weightData = await this.queryHealthData('weight');
      const fatData = await this.queryHealthData('fat_percentage');
      
      // Combine and process the data
      const healthData = this.combineHealthData(weightData, fatData);
      
      this.updateSyncStatus({
        isInProgress: true,
        totalEntries: healthData.length,
        processedEntries: 0,
        newEntries: 0,
        duplicatesSkipped: 0
      });

      // Process in batches, grouping weight and fat data by date
      const newEntries: WeightLogId[] = [];
      let processedCount = 0;
      let duplicatesSkipped = 0;
      
      // Group health data by date
      const dataByDate = this.groupHealthDataByDate(healthData);

      for (let i = 0; i < Object.keys(dataByDate).length; i += this.BATCH_SIZE) {
        const dateKeys = Object.keys(dataByDate).slice(i, i + this.BATCH_SIZE);
        
        for (const dateKey of dateKeys) {
          const dayData = dataByDate[dateKey];
          const weightPoint = dayData.find(d => d.dataType === 'weight');
          const fatPoint = dayData.find(d => d.dataType === 'fat_percentage');
          
          if (weightPoint && !this.isDuplicate(weightPoint, existingEntries)) {
            const weightEntry = await this.convertHealthDataToWeightLog(weightPoint, fatPoint);
            newEntries.push(weightEntry);
          } else if (weightPoint) {
            duplicatesSkipped++;
          }
          
          processedCount++;
          
          this.updateSyncStatus({
            isInProgress: true,
            totalEntries: Object.keys(dataByDate).length,
            processedEntries: processedCount,
            newEntries: newEntries.length,
            duplicatesSkipped
          });
        }

        // Small delay between batches to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Bulk insert new entries
      if (newEntries.length > 0) {
        await this.storageService.bulkUpsertWeightLogEntries(newEntries);
      }

      // Update last sync date
      await this.updateLastSyncDate();

      this.updateSyncStatus({
        isInProgress: false,
        totalEntries: healthData.length,
        processedEntries: processedCount,
        newEntries: newEntries.length,
        duplicatesSkipped,
        lastSyncDate: new Date()
      });

    } catch (error) {
      this.logger.error('Health sync failed:', error);
      this.updateSyncStatus({
        isInProgress: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      });
      throw error;
    }
  }

  private async queryHealthData(dataType: string): Promise<HealthDataPoint[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.MAX_SYNC_DAYS);

    return new Promise((resolve, reject) => {
      const queryOptions = {
        startDate: startDate,
        endDate: endDate,
        dataType: dataType,
        limit: 1000 // Reasonable limit
      };

      const healthPlugin = cordova?.plugins?.health || navigator.health;
      this.logger.debug(`Querying ${dataType} data with options:`, queryOptions);
      healthPlugin.query(
        queryOptions,
        (data: any[]) => {
          this.logger.debug(`Raw ${dataType} data retrieved:`, data);
          this.logger.info(`Number of ${dataType} records found: ${data.length}`);
          
          const healthData: HealthDataPoint[] = data.map(item => ({
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            value: parseFloat(item.value),
            unit: item.unit || (dataType === 'weight' ? 'kg' : '%'),
            sourceName: item.sourceName,
            dataType: dataType
          }));
          
          this.logger.debug(`Processed ${dataType} data:`, healthData);
          
          // Sort by date (oldest first)
          healthData.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
          
          resolve(healthData);
        },
        (error: any) => {
          reject(new Error(`Failed to query ${dataType} data: ${error}`));
        }
      );
    });
  }

  private combineHealthData(weightData: HealthDataPoint[], fatData: HealthDataPoint[]): HealthDataPoint[] {
    this.logger.debug('Combining weight and fat data...');
    const combinedData: HealthDataPoint[] = [...weightData, ...fatData];
    
    // Sort by date
    combinedData.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    this.logger.debug('Combined health data:', combinedData);
    return combinedData;
  }

  private groupHealthDataByDate(healthData: HealthDataPoint[]): { [dateKey: string]: HealthDataPoint[] } {
    const groupedData: { [dateKey: string]: HealthDataPoint[] } = {};
    
    healthData.forEach(dataPoint => {
      const dateKey = dataPoint.startDate.toDateString();
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = [];
      }
      groupedData[dateKey].push(dataPoint);
    });
    
    this.logger.debug('Grouped health data by date:', groupedData);
    return groupedData;
  }

  private async convertHealthDataToWeightLog(dataPoint: HealthDataPoint, fatDataPoint?: HealthDataPoint): Promise<WeightLogId> {
    let weightLbs: number;
    let weightKgs: number;
    let fatLbs: number | undefined;
    let fatKgs: number | undefined;

    // Convert weight based on health data unit
    if (dataPoint.unit.toLowerCase().includes('kg')) {
      weightKgs = dataPoint.value;
      weightLbs = this.unitConversion.kilogramsToPounds(weightKgs);
    } else {
      // Assume pounds if not kg
      weightLbs = dataPoint.value;
      weightKgs = this.unitConversion.poundsToKilograms(weightLbs);
    }

    // Convert fat percentage to weight values if available
    if (fatDataPoint) {
      this.logger.debug('Processing fat data:', fatDataPoint);
      // Fat percentage is typically stored as 0.25 for 25%, convert to percentage if needed
      let fatPercentage = fatDataPoint.value;
      if (fatPercentage <= 1) {
        fatPercentage = fatPercentage * 100; // Convert 0.25 to 25%
      }
      
      // Calculate fat weight from percentage
      fatKgs = (weightKgs * fatPercentage) / 100;
      fatLbs = this.unitConversion.kilogramsToPounds(fatKgs);
      
      this.logger.debug(`Calculated fat: ${fatPercentage}% = ${fatKgs}kg / ${fatLbs}lbs`);
    }

    return {
      id: uuidv4(),
      weightDate: dataPoint.startDate,
      creationDate: new Date(),
      weightLbs: Math.round(weightLbs * 10) / 10, // Round to 1 decimal
      weightKgs: Math.round(weightKgs * 10) / 10,
      // Sync fat data from health platforms
      fatLbs: fatLbs ? Math.round(fatLbs * 10) / 10 : undefined,
      fatKgs: fatKgs ? Math.round(fatKgs * 10) / 10 : undefined,
      // Don't sync muscle data (not available from Health Connect)
      muscleLbs: undefined,
      muscleKgs: undefined
    };
  }

  private isDuplicate(healthData: HealthDataPoint, existingEntries: WeightLogId[]): boolean {
    const targetDate = healthData.startDate;
    const targetWeight = healthData.unit.toLowerCase().includes('kg') 
      ? healthData.value 
      : this.unitConversion.poundsToKilograms(healthData.value); // Convert to kg for comparison

    return existingEntries.some(entry => {
      const entryDate = new Date(entry.weightDate);
      const entryWeight = entry.weightKgs;

      // Check if same date (within same day)
      const sameDay = entryDate.toDateString() === targetDate.toDateString();
      
      // Check if weight is within tolerance
      const weightDiff = Math.abs(entryWeight - targetWeight);
      const withinTolerance = weightDiff <= this.DUPLICATE_TOLERANCE;

      return sameDay && withinTolerance;
    });
  }

  private async getExistingWeightEntries(): Promise<WeightLogId[]> {
    return new Promise((resolve) => {
      this.storageService.weightLog$.subscribe((entries) => {
        resolve(entries);
      }).unsubscribe();
    });
  }

  private updateSyncStatus(status: Partial<HealthSyncStatus>): void {
    this._syncStatus$.next({
      ...this._syncStatus$.value,
      ...status
    });
  }

  private async loadLastSyncDate(): Promise<void> {
    try {
      const lastSync = await this.storageService.getValue('lastHealthSync');
      if (lastSync) {
        this.updateSyncStatus({ lastSyncDate: new Date(lastSync) });
      }
    } catch (error) {
      this.logger.warn('Failed to load last sync date:', error);
    }
  }

  private async updateLastSyncDate(): Promise<void> {
    try {
      const now = new Date();
      await this.storageService.setValue('lastHealthSync', now.toISOString());
    } catch (error) {
      this.logger.warn('Failed to update last sync date:', error);
    }
  }

  // Helper method for testing on web
  async testSync(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      throw new Error('Use real sync on device');
    }

    // Simulate sync process for web testing
    this.updateSyncStatus({ isInProgress: true });

    // Mock data
    const mockData: HealthDataPoint[] = [
      {
        startDate: new Date(Date.now() - 86400000), // Yesterday
        endDate: new Date(Date.now() - 86400000),
        value: 180.5,
        unit: 'lbs',
        dataType: 'weight'
      },
      {
        startDate: new Date(Date.now() - 172800000), // 2 days ago
        endDate: new Date(Date.now() - 172800000),
        value: 181.2,
        unit: 'lbs',
        dataType: 'weight'
      }
    ];

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

    const existingEntries = await this.getExistingWeightEntries();
    const newEntries: WeightLogId[] = [];

    // Group mock data by date (using new processing logic)
    const dataByDate = this.groupHealthDataByDate(mockData);
    
    for (const dateKey of Object.keys(dataByDate)) {
      const dayData = dataByDate[dateKey];
      const weightPoint = dayData.find(d => d.dataType === 'weight');
      const fatPoint = dayData.find(d => d.dataType === 'fat_percentage');
      
      if (weightPoint && !this.isDuplicate(weightPoint, existingEntries)) {
        const weightEntry = await this.convertHealthDataToWeightLog(weightPoint, fatPoint);
        newEntries.push(weightEntry);
      }
    }

    if (newEntries.length > 0) {
      await this.storageService.bulkUpsertWeightLogEntries(newEntries);
    }

    this.updateSyncStatus({
      isInProgress: false,
      totalEntries: mockData.length,
      processedEntries: mockData.length,
      newEntries: newEntries.length,
      duplicatesSkipped: mockData.length - newEntries.length,
      lastSyncDate: new Date()
    });
  }
}