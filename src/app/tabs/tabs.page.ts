import { Component, ViewChild } from '@angular/core';

import { Observable, of, map } from 'rxjs';
import { WeightLogId } from 'src/models/models/weight-log.model';
import {
  IonicWeightLogService,
  Settings,
} from 'src/services/ionic-weight-log.service';
import { WeightLogService } from 'src/services/weight-log.service';
import { WeightEntryModalComponent } from '../components/weight-entry-modal/weight-entry-modal.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  @ViewChild(WeightEntryModalComponent)
  private weightEntryModalComponent: WeightEntryModalComponent;

  todaysLog$: Observable<WeightLogId[]> = of();
  userSettings$: Observable<Settings>;

  constructor(
    private weightLogService: WeightLogService,
    private ionicWeightLogService: IonicWeightLogService
  ) {}

  ngOnInit(): void {
    this.userSettings$ = this.ionicWeightLogService.settings$;
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
  }

  openModal() {
    this.weightEntryModalComponent.setOpen(true);
  }
}
