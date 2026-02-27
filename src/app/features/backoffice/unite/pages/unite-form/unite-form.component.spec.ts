import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UniteFormComponent } from './unite-form.component';

describe('UniteFormComponent', () => {
  let component: UniteFormComponent;
  let fixture: ComponentFixture<UniteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UniteFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UniteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
