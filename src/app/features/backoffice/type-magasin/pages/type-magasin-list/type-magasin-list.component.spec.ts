import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeMagasinListComponent } from './type-magasin-list.component';

describe('TypeMagasinListComponent', () => {
  let component: TypeMagasinListComponent;
  let fixture: ComponentFixture<TypeMagasinListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeMagasinListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TypeMagasinListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
