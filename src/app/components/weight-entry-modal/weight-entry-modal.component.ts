import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { WeightUnitDisplay } from 'src/models/enums/weight-unit.enum';
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

  onSubmit(value: any) {
    const newWeightLog: WeightLogId = {
      ...value,
      id: uuidv4(),
      creationDate: new Date(),
      weightDate: new Date(value.weightDate),
      weightLbs: this.convertFormEntryToDbValue(
        +value.weightAmount,
        weightMetrics.pounds.name,
        this.userSettings.weightMetricDisplay
      ),
      weightKgs: this.convertFormEntryToDbValue(
        +value.weightAmount,
        weightMetrics.kilograms.name,
        this.userSettings.weightMetricDisplay
      ),
      muscleLbs: this.convertFormEntryToDbValue(
        +value.muscleAmount,
        weightMetrics.pounds.name,
        this.userSettings.weightMetricDisplay
      ),
      muscleKgs: this.convertFormEntryToDbValue(
        +value.muscleAmount,
        weightMetrics.kilograms.name,
        this.userSettings.weightMetricDisplay
      ),
      fatLbs: this.convertFormEntryToDbValue(
        +value.fatAmount,
        weightMetrics.pounds.name,
        this.userSettings.weightMetricDisplay
      ),
      fatKgs: this.convertFormEntryToDbValue(
        +value.fatAmount,
        weightMetrics.kilograms.name,
        this.userSettings.weightMetricDisplay
      ),
    };
    this.ionicWeightLogService.insertWeightLogEntry(newWeightLog);
    this.weightEntryForm.reset();
    this.setOpen(false);
  }

  convertFormEntryToDbValue(
    value: number,
    dbUnit: WeightUnitDisplay,
    formUnit: WeightUnitDisplay
  ) {
    if (!value) {
      return undefined;
    }
    if (dbUnit === formUnit) return value;
    switch (dbUnit) {
      case weightMetrics.kilograms.name:
        return this.weightConversionService.poundsToKilograms(value);
      case weightMetrics.pounds.name:
        return this.weightConversionService.kilogramsToPounds(value);
      default:
        return value;
    }
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }
}
