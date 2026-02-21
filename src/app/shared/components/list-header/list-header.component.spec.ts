import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListHeaderComponent } from './list-header.component';

describe('ListHeaderComponent', () => {
  let component: ListHeaderComponent;
  let fixture: ComponentFixture<ListHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ListHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('.text-lg');
    expect(titleElement?.textContent).toBe('Test Title');
  });

  it('should display subtitle when provided', () => {
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('subtitle', 'Test Subtitle');
    fixture.detectChanges();

    const subtitleElement = fixture.nativeElement.querySelector('.text-sm');
    expect(subtitleElement?.textContent).toBe('Test Subtitle');
  });

  it('should display action button when actionLabel is provided', () => {
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('actionLabel', 'New Item');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[mat-raised-button]');
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain('New Item');
  });

  it('should emit action event on button click', () => {
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('actionLabel', 'New Item');

    let emitted = false;
    component.action.subscribe(() => {
      emitted = true;
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[mat-raised-button]');
    button?.click();

    expect(emitted).toBe(true);
  });

  it('should not display button when showAction is false', () => {
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('actionLabel', 'New Item');
    fixture.componentRef.setInput('showAction', false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[mat-raised-button]');
    expect(button).toBeFalsy();
  });
});
