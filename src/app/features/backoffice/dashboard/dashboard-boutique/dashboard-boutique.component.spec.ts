import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardBoutiqueComponent } from './dashboard-boutique.component';

describe('DashboardBoutiqueComponent', () => {
  let component: DashboardBoutiqueComponent;
  let fixture: ComponentFixture<DashboardBoutiqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardBoutiqueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardBoutiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
