import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SwiperOptions, Virtual } from 'swiper';
import SwiperCore, { Pagination, Keyboard } from 'swiper';
import { IonicSlides } from '@ionic/angular';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  IonicWeightLogService,
  Settings,
} from 'src/services/ionic-weight-log.service';
import { WeightUnitDisplay } from 'src/models/enums/weight-unit.enum';
import { Router } from '@angular/router';

SwiperCore.use([Keyboard, Pagination, Virtual, IonicSlides]);

@Component({
  selector: 'app-intro-swiper',
  templateUrl: './intro-swiper.component.html',
  styleUrls: ['./intro-swiper.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class IntroSwiperComponent implements OnInit {
  config: SwiperOptions = {
    slidesPerView: 1,
    pagination: { clickable: true },
    keyboard: { enabled: true },
    centeredSlides: true,
    virtual: true,
  };

  settingsForm: FormGroup = this.fb.group({});

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private ionicWeightLogService: IonicWeightLogService
  ) {}

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    this.settingsForm = this.fb.group({
      personName: new FormControl('', Validators.required),
      weightMetricDisplay: new FormControl(
        WeightUnitDisplay.Pounds,
        Validators.required
      ),
      isLoggingMuscle: new FormControl(false, Validators.required),
      isLoggingFat: new FormControl(false, Validators.required),
    });
  }

  async onSubmit(formValue: Settings) {
    const settings = {
      personName: formValue.personName,
      weightMetricDisplay: formValue.weightMetricDisplay,
      isLoggingMuscle: formValue.isLoggingMuscle,
      isLoggingFat: formValue.isLoggingFat,
    } as Settings;
    await this.ionicWeightLogService.saveSettings(settings);
    await this.router.navigateByUrl('');
  }
}
