import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UniteListComponent } from './unite-list.component';

describe('UniteListComponent', () => {
  let component: UniteListComponent;
  let fixture: ComponentFixture<UniteListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UniteListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UniteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
