import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeMagasinFormComponent } from './type-magasin-form.component';

describe('TypeMagasinFormComponent', () => {
  let component: TypeMagasinFormComponent;
  let fixture: ComponentFixture<TypeMagasinFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeMagasinFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TypeMagasinFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
