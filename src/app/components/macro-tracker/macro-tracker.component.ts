import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-macro-tracker',
  templateUrl: './macro-tracker.component.html',
  styleUrls: ['./macro-tracker.component.scss'],
})
export class MacroTrackerComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  pinFormatter(value: number) {
    return `${value}`;
  }
}
