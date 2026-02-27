import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxMagasinFormComponent } from './box-magasin-form.component';

describe('BoxMagasinFormComponent', () => {
  let component: BoxMagasinFormComponent;
  let fixture: ComponentFixture<BoxMagasinFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoxMagasinFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BoxMagasinFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
