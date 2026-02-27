import { TestBed } from '@angular/core/testing';

import { LoyerBoxService } from './loyer-box.service';

describe('LoyerBoxService', () => {
  let service: LoyerBoxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoyerBoxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
