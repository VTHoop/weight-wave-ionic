import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { WeightUnitDisplay } from 'src/models/enums/weight-unit.enum';
import {
  IonicStorageService,
  Settings,
} from 'src/services/ionic-storage.service';

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
    private toastController: ToastController
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

  ngOnDestroy(): void {
    this.openSubscriptions.forEach((subscription) =>
      subscription.unsubscribe()
    );
  }
}
