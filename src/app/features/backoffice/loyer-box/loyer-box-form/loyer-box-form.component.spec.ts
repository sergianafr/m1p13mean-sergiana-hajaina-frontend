import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyerBoxFormComponent } from './loyer-box-form.component';

describe('LoyerBoxFormComponent', () => {
  let component: LoyerBoxFormComponent;
  let fixture: ComponentFixture<LoyerBoxFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoyerBoxFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoyerBoxFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
