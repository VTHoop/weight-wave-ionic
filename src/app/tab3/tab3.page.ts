import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  IonicWeightLogService,
  WeightLogStorage,
} from 'src/services/ionic-weight-log.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
})
export class Tab3Page implements OnInit {
  profileForm: FormGroup = this.fb.group({});
  name: string = '';

  constructor(
    private fb: FormBuilder,
    private ionicWeightLogService: IonicWeightLogService
  ) {}

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    this.profileForm = this.fb.group({
      personName: new FormControl('', Validators.required),
      weightMetricDisplay: new FormControl(
        WeightMetricDisplay.Pounds,
        Validators.required
      ),
      isLoggingMuscle: new FormControl(false, Validators.required),
      isLoggingFat: new FormControl(false, Validators.required),
    });
    this.ionicWeightLogService.getSettings().subscribe((settings) => {
      this.profileForm.patchValue(settings);
    });
  }

  onSubmit(formValue: Settings) {
    const settings = {
      personName: formValue.personName,
      weightMetricDisplay: formValue.weightMetricDisplay,
      isLoggingMuscle: formValue.isLoggingMuscle,
      isLoggingFat: formValue.isLoggingFat,
    } as Settings;
    this.ionicWeightLogService.set(WeightLogStorage.Settings, settings);
  }
}

export interface Settings {
  personName: string;
  weightMetricDisplay: WeightMetricDisplay;
  isLoggingMuscle: boolean;
  isLoggingFat: boolean;
}

enum WeightMetricDisplay {
  Pounds = 'pounds',
  Kilograms = 'kilograms',
}
