import { TestBed } from '@angular/core/testing';

import { BoxMagasinService } from './box-magasin.service';

describe('BoxMagasinService', () => {
  let service: BoxMagasinService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoxMagasinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
