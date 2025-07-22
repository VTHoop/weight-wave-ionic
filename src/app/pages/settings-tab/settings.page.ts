import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { WeightUnitDisplay } from 'src/models/enums/weight-unit.enum';
import {
  IonicStorageService,
  Settings,
} from 'src/services/ionic-storage.service';
import { DataExportService } from 'src/services/data-export.service';
import {
  DataImportService,
  ImportMode,
  ImportOptions,
  ImportProgress,
} from 'src/services/data-import.service';

@Component({
  selector: 'app-settings-tab',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
})
export class SettingsPage implements OnInit, OnDestroy {
  openSubscriptions: Subscription[] = [];
  profileForm: FormGroup = this.fb.group({});
  name: string = '';

  constructor(
    private fb: FormBuilder,
    private ionicStorageService: IonicStorageService,
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private dataExportService: DataExportService,
    private dataImportService: DataImportService
  ) {}

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    this.profileForm = this.fb.group({
      personName: new FormControl('', Validators.required),
      weightMetricDisplay: new FormControl(
        WeightUnitDisplay.Pounds,
        Validators.required
      ),
      isLoggingMuscle: new FormControl(false, Validators.required),
      isLoggingFat: new FormControl(false, Validators.required),
    });
    this.openSubscriptions.push(
      this.ionicStorageService.settings$.subscribe((settings) => {
        this.profileForm.patchValue(settings);
      })
    );
  }

  async onSubmit(formValue: Settings) {
    const settings = {
      personName: formValue.personName,
      weightMetricDisplay: formValue.weightMetricDisplay,
      isLoggingMuscle: formValue.isLoggingMuscle,
      isLoggingFat: formValue.isLoggingFat,
    } as Settings;
    await this.ionicStorageService.saveSettings(settings);
    const toast = await this.toastController.create({
      message: 'Settings Updated',
      duration: 1500,
      cssClass: 'success-toast',
      position: 'bottom',
    });

    await toast.present();
  }

  async exportData() {
    const alert = await this.alertController.create({
      header: 'Export Data',
      message:
        'This will export all your weight measurements and settings to a JSON file.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Export',
          handler: async () => {
            await this.performExport();
          },
        },
      ],
    });

    await alert.present();
  }

  private async performExport() {
    const loading = await this.loadingController.create({
      message: 'Exporting data...',
    });
    await loading.present();

    try {
      const filePath = await this.dataExportService.exportToFile();
      await loading.dismiss();

      const toast = await this.toastController.create({
        message: 'Data exported successfully!',
        duration: 3000,
        cssClass: 'success-toast',
        position: 'bottom',
      });
      await toast.present();
    } catch (error) {
      await loading.dismiss();
      console.error('Export failed:', error);

      const toast = await this.toastController.create({
        message: 'Export failed. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    }
  }

  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        await this.processImportFile(file);
      }
    };
    input.click();
  }

  private async processImportFile(file: File) {
    try {
      const fileContent = await this.readFileAsText(file);
      const importData = JSON.parse(fileContent);

      if (!this.dataImportService.validateImportData(importData)) {
        throw new Error('Invalid file format');
      }

      await this.showImportOptionsDialog(importData);
    } catch (error) {
      console.error('Import file processing failed:', error);
      const toast = await this.toastController.create({
        message:
          'Invalid file format. Please select a valid Weight Wave export file.',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  private async showImportOptionsDialog(importData: any) {
    const alert = await this.alertController.create({
      header: 'Import Options',
      message: `Found ${
        importData.weightLog?.length || 0
      } weight entries. How should we handle existing data?`,
      inputs: [
        {
          name: 'mode',
          type: 'radio',
          label: 'Replace matching dates',
          value: ImportMode.OVERWRITE_OVERLAPPING,
          checked: true,
        },
        {
          name: 'mode',
          type: 'radio',
          label: 'Only add new dates',
          value: ImportMode.KEEP_EXISTING,
          checked: false,
        },
        {
          name: 'mode',
          type: 'radio',
          label: 'Replace all data',
          value: ImportMode.OVERWRITE_ALL,
          checked: false,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Import',
          handler: async (data) => {
            const options: ImportOptions = {
              mode: data as ImportMode,
              importSettings: true,
              importWeightLog: true,
              createBackup: true,
            };
            await this.performImport(importData, options);
          },
        },
      ],
    });

    await alert.present();
  }

  private async performImport(importData: any, options: ImportOptions) {
    const loading = await this.loadingController.create({
      message: 'Preparing import...',
      spinner: 'circular',
    });
    await loading.present();

    try {
      const result = await this.dataImportService.importData(
        importData,
        options,
        (progress: ImportProgress) => {
          // Update loading message with progress
          const progressPercent = Math.round(progress.overallProgress);
          loading.message = `${progress.currentStep} (${progressPercent}%)`;
        }
      );

      await loading.dismiss();

      if (result.success) {
        const message = `Import successful!
          ${result.settingsImported ? 'Settings updated. ' : ''}
          ${result.weightEntriesImported} weight entries imported, ${
          result.weightEntriesSkipped
        } skipped.`;

        const toast = await this.toastController.create({
          message,
          duration: 5000,
          cssClass: 'success-toast',
          position: 'bottom',
        });
        await toast.present();
      } else {
        throw new Error(result.errors.join(', '));
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Import failed:', error);

      const toast = await this.toastController.create({
        message: 'Import failed. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    }
  }

  ngOnDestroy(): void {
    this.openSubscriptions.forEach((subscription) =>
      subscription.unsubscribe()
    );
  }
}
