import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { IonContent, IonInput, ToastController } from '@ionic/angular';
import { WeightUnitDisplay } from 'src/models/enums/weight-unit.enum';
import { WeightLog, WeightLogId } from 'src/models/models/weight-log.model';
import {
  IonicStorageService,
  Settings,
  weightMetrics,
} from 'src/services/ionic-storage.service';
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
  formSubmitted = false;
  fieldHasBeenEdited = {
    weight: false,
    fat: false,
    muscle: false
  };
  @Input() userSettings: Settings;
  @ViewChild('weightInput') weightInput!: IonInput;
  @ViewChild(IonContent) content!: IonContent;

  constructor(
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private ionicStorageService: IonicStorageService,
    private weightConversionService: UnitConversionService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    const today = new Date();
    this.weightEntryForm = this.fb.group({
      weightDate: new FormControl(
        today.toISOString(),
        Validators.required
      ),
      weightAmount: new FormControl(null, [
        Validators.required,
        Validators.min(0.1),
        Validators.max(1000),
      ]),
      muscleAmount: new FormControl(null, [
        Validators.min(0),
        Validators.max(1000),
      ]),
      fatAmount: new FormControl(null, [
        Validators.min(0),
        Validators.max(1000),
      ]),
    });
  }

  onSubmit(value: any) {
    this.formSubmitted = true;
    if (this.weightEntryForm.valid) {
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
      this.ionicStorageService.insertWeightLogEntry(newWeightLog);
      this.showSuccessToast();
      this.resetForm();
      this.setOpen(false);
    }
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
    if (isOpen) {
      this.resetForm();
    }
  }


  resetForm() {
    this.createForm();
    this.formSubmitted = false;
    this.fieldHasBeenEdited = {
      weight: false,
      fat: false,
      muscle: false
    };
    // Ensure the form starts in a pristine, untouched state
    this.weightEntryForm.markAsUntouched();
    this.weightEntryForm.markAsPristine();
  }

  setToday() {
    const today = new Date();
    this.weightEntryForm.patchValue({
      weightDate: today.toISOString()
    });
  }


  onEnterKey() {
    if (this.weightEntryForm.valid) {
      this.onSubmit(this.weightEntryForm.value);
    }
  }

  async showSuccessToast() {
    const toast = await this.toastController.create({
      message: 'Weight entry saved successfully!',
      duration: 2000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle'
    });
    toast.present();
  }

  getUnitAbbrev(): string {
    return this.userSettings?.weightMetricDisplay === weightMetrics.kilograms.name 
      ? 'kg' 
      : 'lbs';
  }

  getWeightPlaceholder(): string {
    const unit = this.getUnitAbbrev();
    return unit === 'kg' ? 'e.g., 70.5' : 'e.g., 155.5';
  }

  getFatPlaceholder(): string {
    const unit = this.getUnitAbbrev();
    return unit === 'kg' ? 'e.g., 15.2' : 'e.g., 33.5';
  }

  getMusclePlaceholder(): string {
    const unit = this.getUnitAbbrev();
    return unit === 'kg' ? 'e.g., 35.8' : 'e.g., 79.0';
  }

  onInputFocus(event: any) {
    // Small delay to allow keyboard to appear, then scroll to the focused element
    setTimeout(() => {
      const focusedElement = event.target.closest('ion-item');
      if (focusedElement && this.content) {
        this.content.scrollToPoint(0, focusedElement.offsetTop - 100, 300);
      }
    }, 300);
  }

  onFieldInput(fieldName: 'weight' | 'fat' | 'muscle') {
    // Mark field as edited only when user actually types something
    this.fieldHasBeenEdited[fieldName] = true;
  }

  shouldShowError(fieldName: string, controlName: string): boolean {
    const control = this.weightEntryForm.get(controlName);
    if (!control) return false;
    
    const field = fieldName as 'weight' | 'fat' | 'muscle';
    return control.invalid && (this.fieldHasBeenEdited[field] || this.formSubmitted);
  }
}
