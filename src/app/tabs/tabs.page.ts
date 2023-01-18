import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { Observable, of, map } from 'rxjs';
import { WeightUnit } from 'src/models/enums/weight-unit.enum';
import { WeightLogId, WeightLog } from 'src/models/models/weight-log.model';
import { WeightLogService } from 'src/services/weight-log.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  isModalOpen = false;
  todaysLog$: Observable<WeightLogId[]> = of();
  weightEntryForm: FormGroup = this.fb.group({});

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  constructor(
    private fb: FormBuilder,
    private weightLogService: WeightLogService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.todaysLog$ = this.weightLogService.weightLog$.pipe(
      map((log) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return log.filter(
          (entry) =>
            today.getTime() ===
            new Date(
              entry.creationDate.getFullYear(),
              entry.creationDate.getMonth(),
              entry.creationDate.getDate()
            ).getTime()
        );
      })
    );
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
    const newWeightLog: WeightLog = {
      ...value,
      creationDate: new Date(),
      weightDate: new Date(value.weightDate),
      weightAmount: +value.weightAmount,
      fatAmount: value.fatAmount ? +value.fatAmount : undefined,
      muscleAmount: value.muscleAmount ? +value.muscleAmount : undefined,
      weightUnit: WeightUnit.LB,
      muscleUnit: value.muscleAmount ? WeightUnit.LB : undefined,
      fatUnit: value.fatAmount ? WeightUnit.LB : undefined,
    };

    this.weightLogService.addWeightLogEntry(newWeightLog);
    this.weightEntryForm.reset();
    this.setOpen(false);
  }
}
