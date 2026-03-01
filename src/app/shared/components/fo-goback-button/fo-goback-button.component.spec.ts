import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoGobackButtonComponent } from './fo-goback-button.component';

describe('FoGobackButtonComponent', () => {
  let component: FoGobackButtonComponent;
  let fixture: ComponentFixture<FoGobackButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoGobackButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FoGobackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
