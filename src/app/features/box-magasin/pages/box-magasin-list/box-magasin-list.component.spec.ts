import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxMagasinListComponent } from './box-magasin-list.component';

describe('BoxMagasinListComponent', () => {
  let component: BoxMagasinListComponent;
  let fixture: ComponentFixture<BoxMagasinListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoxMagasinListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BoxMagasinListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
