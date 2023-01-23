import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { WeightLog, WeightLogId } from 'src/models/models/weight-log.model';
import {
  IonicWeightLogService,
  Settings,
  weightMetrics,
} from 'src/services/ionic-weight-log.service';
import { UnitConversionService } from 'src/services/unit-conversion.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-weight-entry-modal',
  templateUrl: './weight-entry-modal.component.html',
  styleUrls: ['./weight-entry-modal.component.scss'],
})
export class WeightEntryModalComponent implements OnInit {
  isModalOpen = false;
  weightEntryForm: FormGroup = this.fb.group({});
  @Input() userSettings: Settings;

  constructor(
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private ionicWeightLogService: IonicWeightLogService,
    private weightConversionService: UnitConversionService
  ) {}

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    const today = new Date();
    this.weightEntryForm = this.fb.group({
      weightDate: new FormControl(
        this.datePipe.transform(today, 'y-MM-ddTHH:mm'),
        Validators.required
      ),
      weightAmount: new FormControl(null, [
        Validators.required,
        Validators.pattern('^\\d*\\.?\\d+$'),
      ]),
      muscleAmount: new FormControl(null, Validators.pattern('^\\d*\\.?\\d+$')),
      fatAmount: new FormControl(null, Validators.pattern('^\\d*\\.?\\d+$')),
    });
  }

  onSubmit(value: WeightLog) {
    const newWeightLog: WeightLogId = {
      ...value,
      id: uuidv4(),
      creationDate: new Date(),
      weightDate: new Date(value.weightDate),
      weightLbs:
        this.userSettings.weightMetricDisplay === weightMetrics.pounds.name
          ? +value.weightAmount
          : this.weightConversionService.kilogramsToPounds(+value.weightAmount),
      weightKgs:
        this.userSettings.weightMetricDisplay === weightMetrics.kilograms.name
          ? +value.weightAmount
          : this.weightConversionService.poundsToKilograms(+value.weightAmount),
      muscleLbs:
        this.userSettings.weightMetricDisplay === weightMetrics.pounds.name
          ? +value.muscleAmount
          : this.weightConversionService.kilogramsToPounds(+value.muscleAmount),
      muscleKgs:
        this.userSettings.weightMetricDisplay === weightMetrics.kilograms.name
          ? +value.muscleAmount
          : this.weightConversionService.poundsToKilograms(+value.muscleAmount),
      fatLbs:
        this.userSettings.weightMetricDisplay === weightMetrics.pounds.name
          ? +value.fatAmount
          : this.weightConversionService.kilogramsToPounds(+value.fatAmount),
      fatKgs:
        this.userSettings.weightMetricDisplay === weightMetrics.kilograms.name
          ? +value.fatAmount
          : this.weightConversionService.poundsToKilograms(+value.fatAmount),
    };
    this.ionicWeightLogService.insertWeightLogEntry(newWeightLog);
    this.weightEntryForm.reset();
    this.setOpen(false);
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }
}
