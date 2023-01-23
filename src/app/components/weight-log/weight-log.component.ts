import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { WeightLogDisplay } from 'src/app/weight-log-tab/weight-log.page';
import { WeightLog, WeightLogId } from 'src/models/models/weight-log.model';
import { WeightLogService } from 'src/services/weight-log.service';

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

  constructor(
    private fb: FormBuilder,
    public weightLogService: WeightLogService
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
      weightAmount: new FormControl({ value: entry.weight, disabled: true }, [
        Validators.required,
        Validators.pattern('^\\d*\\.?\\d+$'),
      ]),
      muscleAmount: new FormControl(
        {
          value: entry.muscle,
          disabled: true,
        },
        Validators.pattern('^\\d*\\.?\\d+$')
      ),
      fatAmount: new FormControl(
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
      weightAmount: new FormControl({ value: entry.weight, disabled: false }, [
        Validators.required,
        Validators.pattern('^\\d*\\.?\\d+$'),
      ]),
      muscleAmount: new FormControl(
        {
          value: entry.muscle,
          disabled: false,
        },
        Validators.pattern('^\\d*\\.?\\d+$')
      ),
      fatAmount: new FormControl(
        { value: entry.fat, disabled: false },
        Validators.pattern('^\\d*\\.?\\d+$')
      ),
    });
  }

  cancelChange() {
    this.makeFormViewable(this.selectedDoc);
    this.inEditMode = false;
  }

  onSubmit(value: WeightLogId) {
    const id = value.id;
    delete value.id;
    const newWeightLog: WeightLog = {
      ...value,
      creationDate: new Date(),
      weightDate: new Date(value.weightDate),
      weightAmount: +value.weightAmount,
      fatAmount: value.fatAmount ? +value.fatAmount : undefined,
      muscleAmount: value.muscleAmount ? +value.muscleAmount : undefined,
    };

    this.weightLogService.updateWeightLogEntry(id, newWeightLog);
    this.weightEditForm.reset();
    this.isOpen = false;
  }

  deleteEntry() {
    this.weightLogService.deleteWeightLogEntry(this.selectedDoc.id);
    this.isOpen = false;
  }
}
