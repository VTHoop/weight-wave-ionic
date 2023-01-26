import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { WeightLogDisplay } from 'src/app/pages/weight-log-tab/weight-log.page';
import { WeightLogId } from 'src/models/models/weight-log.model';
import {
  IonicWeightLogService,
  Settings,
  weightMetrics,
} from 'src/services/ionic-weight-log.service';
import { UnitConversionService } from 'src/services/unit-conversion.service';

@Component({
  selector: 'app-weight-log',
  templateUrl: './weight-log.component.html',
  styleUrls: ['./weight-log.component.scss'],
})
export class WeightLogComponent implements OnInit {
  weightEditForm: FormGroup<any> = this.fb.group({});
  weightDate: Date;
  selectedDoc: WeightLogDisplay;
  inEditMode: boolean;

  @ViewChild('popover') popover;
  @Input() weightLogDisplay: WeightLogDisplay[];
  @Input() userSettings: Settings;

  constructor(
    private fb: FormBuilder,
    private ionicWeightLogService: IonicWeightLogService,
    private weightConversionService: UnitConversionService
  ) {}

  ngOnInit(): void {}

  isOpen = false;

  presentPopover(e: Event, entry: WeightLogDisplay) {
    this.popover.event = e;
    this.selectedDoc = entry;
    this.isOpen = true;

    this.makeFormViewable(entry);
  }

  dismissPopover() {
    this.isOpen = false;
    this.inEditMode = false;
  }

  makeFormViewable(entry: WeightLogDisplay) {
    this.weightDate = entry.weightDate;
    this.weightEditForm = this.fb.group({
      weight: new FormControl({ value: entry.weight, disabled: true }, [
        Validators.required,
        Validators.pattern('^\\d*\\.?\\d+$'),
      ]),
      muscle: new FormControl(
        {
          value: entry.muscle,
          disabled: true,
        },
        Validators.pattern('^\\d*\\.?\\d+$')
      ),
      fat: new FormControl(
        { value: entry.fat, disabled: true },
        Validators.pattern('^\\d*\\.?\\d+$')
      ),
    });
  }

  makeFormEditable(entry: WeightLogDisplay) {
    this.inEditMode = true;
    this.weightDate = entry.weightDate;
    this.weightEditForm = this.fb.group({
      id: new FormControl(entry.id),
      weightDate: new FormControl(entry.weightDate),
      weight: new FormControl({ value: entry.weight, disabled: false }, [
        Validators.required,
        Validators.pattern('^\\d*\\.?\\d+$'),
      ]),
      muscle: new FormControl(
        {
          value: entry.muscle,
          disabled: false,
        },
        Validators.pattern('^\\d*\\.?\\d+$')
      ),
      fat: new FormControl(
        { value: entry.fat, disabled: false },
        Validators.pattern('^\\d*\\.?\\d+$')
      ),
    });
  }

  cancelChange() {
    this.makeFormViewable(this.selectedDoc);
    this.inEditMode = false;
  }

  onSubmit(value: WeightLogDisplay) {
    const newWeightLog: WeightLogId = {
      ...value,
      creationDate: new Date(),
      weightDate: new Date(value.weightDate),
      weightLbs:
        this.userSettings.weightMetricDisplay === weightMetrics.pounds.name
          ? +value.weight
          : this.weightConversionService.kilogramsToPounds(+value.weight),
      weightKgs:
        this.userSettings.weightMetricDisplay === weightMetrics.kilograms.name
          ? +value.weight
          : this.weightConversionService.poundsToKilograms(+value.weight),
      muscleLbs:
        this.userSettings.weightMetricDisplay === weightMetrics.pounds.name
          ? +value.muscle
          : this.weightConversionService.kilogramsToPounds(+value.muscle),
      muscleKgs:
        this.userSettings.weightMetricDisplay === weightMetrics.kilograms.name
          ? +value.muscle
          : this.weightConversionService.poundsToKilograms(+value.muscle),
      fatLbs:
        this.userSettings.weightMetricDisplay === weightMetrics.pounds.name
          ? +value.fat
          : this.weightConversionService.kilogramsToPounds(+value.fat),
      fatKgs:
        this.userSettings.weightMetricDisplay === weightMetrics.kilograms.name
          ? +value.fat
          : this.weightConversionService.poundsToKilograms(+value.fat),
    };

    this.ionicWeightLogService.updateWeightLogEntry(newWeightLog);
    this.weightEditForm.reset();
    this.isOpen = false;
  }

  deleteEntry() {
    this.ionicWeightLogService.deleteWeightLogEntry(this.selectedDoc.id);
    this.isOpen = false;
  }
}
