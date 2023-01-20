import { TestBed } from '@angular/core/testing';

import { IonicWeightLogService } from './ionic-weight-log.service';

describe('IonicWeightLogService', () => {
  let service: IonicWeightLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IonicWeightLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
