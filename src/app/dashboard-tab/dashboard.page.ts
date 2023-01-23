import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { IonicWeightLogService } from 'src/services/ionic-weight-log.service';
import { WeightLogDisplay } from '../weight-log-tab/weight-log.page';
@Component({
  selector: 'dashboard-tab',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  // weightLogDisplay$: Observable<WeightLogDisplay[]>;

  constructor(private ionicWeightLogService: IonicWeightLogService) {}

  ngOnInit(): void {
    // throw new Error('Method not implemented.');
  }
}
