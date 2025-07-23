import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IonicStorageService, Settings } from './ionic-storage.service';
import { WeightLogId } from 'src/models/models/weight-log.model';
import { ExportData } from './data-export.service';

export enum ImportMode {
  OVERWRITE_ALL = 'overwrite_all',
  OVERWRITE_OVERLAPPING = 'overwrite_overlapping', 
  MERGE_BY_DATE = 'merge_by_date',
  KEEP_EXISTING = 'keep_existing'
}

export interface ImportResult {
  success: boolean;
  settingsImported: boolean;
  weightEntriesImported: number;
  weightEntriesSkipped: number;
  errors: string[];
}

export interface ImportProgress {
  currentStep: string;
  totalSteps: number;
  currentStepProgress: number;
  overallProgress: number;
}

export interface ImportOptions {
  mode: ImportMode;
  importSettings: boolean;
  importWeightLog: boolean;
  createBackup: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataImportService {

  constructor(private storageService: IonicStorageService) { }

  async importData(data: ExportData, options: ImportOptions, onProgress?: (progress: ImportProgress) => void): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      settingsImported: false,
      weightEntriesImported: 0,
      weightEntriesSkipped: 0,
      errors: []
    };

    const totalSteps = (options.createBackup ? 1 : 0) + 
                       (options.importSettings ? 1 : 0) + 
                       (options.importWeightLog ? 1 : 0);
    let currentStep = 0;

    try {
      // Create backup if requested
      if (options.createBackup) {
        currentStep++;
        onProgress?.({
          currentStep: 'Creating backup...',
          totalSteps,
          currentStepProgress: 0,
          overallProgress: (currentStep - 1) / totalSteps * 100
        });
        // TODO: Implement backup creation
        onProgress?.({
          currentStep: 'Creating backup...',
          totalSteps,
          currentStepProgress: 100,
          overallProgress: currentStep / totalSteps * 100
        });
      }

      // Import settings
      if (options.importSettings && data.settings) {
        currentStep++;
        onProgress?.({
          currentStep: 'Importing settings...',
          totalSteps,
          currentStepProgress: 0,
          overallProgress: (currentStep - 1) / totalSteps * 100
        });
        await this.storageService.saveSettings(data.settings);
        result.settingsImported = true;
        onProgress?.({
          currentStep: 'Importing settings...',
          totalSteps,
          currentStepProgress: 100,
          overallProgress: currentStep / totalSteps * 100
        });
      }

      // Import weight log
      if (options.importWeightLog && data.weightLog) {
        currentStep++;
        const weightResult = await this.importWeightLogOptimized(data.weightLog, options.mode, (progress) => {
          onProgress?.({
            currentStep: 'Importing weight entries...',
            totalSteps,
            currentStepProgress: progress,
            overallProgress: ((currentStep - 1) + progress / 100) / totalSteps * 100
          });
        });
        result.weightEntriesImported = weightResult.imported;
        result.weightEntriesSkipped = weightResult.skipped;
      }

      onProgress?.({
        currentStep: 'Complete!',
        totalSteps,
        currentStepProgress: 100,
        overallProgress: 100
      });

      result.success = true;
      return result;

    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
      result.success = false;
      return result;
    }
  }

  private async importWeightLog(importEntries: WeightLogId[], mode: ImportMode): Promise<{imported: number, skipped: number}> {
    let imported = 0;
    let skipped = 0;

    const existingEntries = await firstValueFrom(this.storageService.weightLog$) || [];
    
    for (const entry of importEntries) {
      const existingEntry = existingEntries.find(e => 
        new Date(e.weightDate).toDateString() === new Date(entry.weightDate).toDateString()
      );

      let shouldImport = false;

      switch (mode) {
        case ImportMode.OVERWRITE_ALL:
          shouldImport = true;
          break;
        
        case ImportMode.OVERWRITE_OVERLAPPING:
          shouldImport = true;
          break;
        
        case ImportMode.MERGE_BY_DATE:
          if (existingEntry) {
            // Keep the newer entry based on creation date
            shouldImport = new Date(entry.creationDate) > new Date(existingEntry.creationDate);
          } else {
            shouldImport = true;
          }
          break;
        
        case ImportMode.KEEP_EXISTING:
          shouldImport = !existingEntry;
          break;
      }

      if (shouldImport) {
        if (existingEntry && mode !== ImportMode.OVERWRITE_ALL) {
          await this.storageService.updateWeightLogEntry(entry);
        } else {
          await this.storageService.insertWeightLogEntry(entry);
        }
        imported++;
      } else {
        skipped++;
      }
    }

    return { imported, skipped };
  }


  private async importWeightLogOptimized(importEntries: WeightLogId[], mode: ImportMode, onProgress?: (progress: number) => void): Promise<{imported: number, skipped: number}> {
    if (mode === ImportMode.OVERWRITE_ALL) {
      // Simple case: replace all data
      await this.storageService.replaceAllWeightLogEntries(importEntries);
      onProgress?.(100);
      return { imported: importEntries.length, skipped: 0 };
    }

    // For other modes, we need to process in batches
    const existingEntries = await firstValueFrom(this.storageService.weightLog$) || [];
    const entriesToImport: WeightLogId[] = [];
    let skipped = 0;
    
    const batchSize = 50; // Process in chunks to provide progress updates
    const totalEntries = importEntries.length;
    
    for (let i = 0; i < totalEntries; i += batchSize) {
      const batch = importEntries.slice(i, i + batchSize);
      
      for (const entry of batch) {
        const existingEntry = existingEntries.find(e => 
          new Date(e.weightDate).toDateString() === new Date(entry.weightDate).toDateString()
        );

        let shouldImport = false;
        switch (mode) {
          case ImportMode.OVERWRITE_OVERLAPPING:
            shouldImport = true;
            break;
          case ImportMode.MERGE_BY_DATE:
            if (existingEntry) {
              shouldImport = new Date(entry.creationDate) > new Date(existingEntry.creationDate);
            } else {
              shouldImport = true;
            }
            break;
          case ImportMode.KEEP_EXISTING:
            shouldImport = !existingEntry;
            break;
        }

        if (shouldImport) {
          entriesToImport.push(entry);
        } else {
          skipped++;
        }
      }
      
      // Update progress
      const progress = Math.min(100, ((i + batchSize) / totalEntries) * 100);
      onProgress?.(progress);
      
      // Small delay to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    // Bulk insert all entries to import
    if (entriesToImport.length > 0) {
      await this.storageService.bulkUpsertWeightLogEntries(entriesToImport);
    }
    
    onProgress?.(100);
    return { imported: entriesToImport.length, skipped };
  }


  validateImportData(data: any): data is ExportData {
    return (
      data &&
      typeof data === 'object' &&
      data.exportInfo &&
      typeof data.exportInfo.timestamp === 'string' &&
      typeof data.exportInfo.appVersion === 'string' &&
      data.exportInfo.exportVersion === '1.0' &&
      data.settings &&
      Array.isArray(data.weightLog)
    );
  }
}