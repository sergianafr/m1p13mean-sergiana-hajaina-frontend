import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MagasinFormComponent } from './magasin-form.component';

describe('MagasinFormComponent', () => {
  let component: MagasinFormComponent;
  let fixture: ComponentFixture<MagasinFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MagasinFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MagasinFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
