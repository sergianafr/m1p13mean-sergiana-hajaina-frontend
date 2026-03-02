import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraitesComponent } from './traites.component';

describe('TraitesComponent', () => {
  let component: TraitesComponent;
  let fixture: ComponentFixture<TraitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraitesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TraitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
