import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable, combineLatest, map, take } from 'rxjs';
import { IonicStorageService, Settings } from './ionic-storage.service';
import { WeightLogId } from 'src/models/models/weight-log.model';

export interface ExportData {
  exportInfo: {
    timestamp: string;
    appVersion: string;
    exportVersion: '1.0';
  };
  settings: Settings;
  weightLog: WeightLogId[];
}

@Injectable({
  providedIn: 'root',
})
export class DataExportService {
  constructor(
    private storageService: IonicStorageService,
    private platform: Platform
  ) {}

  exportAllData(): Observable<ExportData> {
    return combineLatest([
      this.storageService.settings$,
      this.storageService.weightLog$,
    ]).pipe(
      map(([settings, weightLog]) => ({
        exportInfo: {
          timestamp: new Date().toISOString(),
          appVersion: '0.0.1', // TODO: Read from package.json or environment
          exportVersion: '1.0' as const,
        },
        settings,
        weightLog,
      }))
    );
  }

  async exportToFile(): Promise<string> {
    const exportData = await this.exportAllData().pipe(take(1)).toPromise();
    const jsonString = JSON.stringify(exportData, null, 2);
    const fileName = `weight-mate-export-${
      new Date().toISOString().split('T')[0]
    }.json`;

    if (this.platform.is('capacitor')) {
      return this.saveToDeviceFile(jsonString, fileName);
    } else {
      return this.downloadToWeb(jsonString, fileName);
    }
  }

  private async saveToDeviceFile(
    data: string,
    fileName: string
  ): Promise<string> {
    try {
      const { Filesystem } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');

      const result = await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: 'DOCUMENTS' as any, // Directory.Documents
        encoding: 'utf8' as any,
      });

      // Share the file so user can save it where they want
      try {
        const canShare = await Share.canShare();
        if (canShare.value) {
          await Share.share({
            title: 'Weight Wave Data Export',
            text: 'Your Weight Wave data export',
            url: result.uri,
            dialogTitle: 'Save or share your data export',
          });
        }
      } catch (shareError) {
        console.warn('Share not available, file saved to Documents folder');
      }

      return result.uri;
    } catch (error) {
      console.error('Error saving file to device:', error);
      throw new Error('Failed to save export file to device');
    }
  }

  private downloadToWeb(data: string, fileName: string): Promise<string> {
    return new Promise((resolve) => {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      resolve(url);
    });
  }

  validateExportData(data: any): data is ExportData {
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
