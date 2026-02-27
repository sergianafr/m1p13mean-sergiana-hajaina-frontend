import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyerBoxListComponent } from './loyer-box-list.component';

describe('LoyerBoxListComponent', () => {
  let component: LoyerBoxListComponent;
  let fixture: ComponentFixture<LoyerBoxListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoyerBoxListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoyerBoxListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
