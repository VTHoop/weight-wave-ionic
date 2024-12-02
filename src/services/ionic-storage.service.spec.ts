import { TestBed } from '@angular/core/testing';

import { IonicWeightLogService } from './ionic-storage.service';

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
