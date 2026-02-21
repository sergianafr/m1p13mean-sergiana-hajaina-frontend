import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { DynamicTableComponent } from './dynamic-table.component';
import { DynamicTableConfig } from '../../models/table-config.model';

describe('DynamicTableComponent', () => {
  let component: DynamicTableComponent;
  let fixture: ComponentFixture<DynamicTableComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DynamicTableComponent, BrowserAnimationsModule],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty message when no data', () => {
    const config: DynamicTableConfig = {
      columns: [
        { key: 'name', label: 'Name' }
      ],
      emptyMessage: 'No data available'
    };

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state p');
    expect(emptyState?.textContent).toContain('No data available');
  });

  it('should display loading spinner when loading', () => {
    const config: DynamicTableConfig = {
      columns: [{ key: 'name', label: 'Name' }],
      loading: true
    };

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should render table with data', () => {
    const config: DynamicTableConfig = {
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'price', label: 'Price', type: 'currency' }
      ]
    };

    const data = [
      { _id: '1', name: 'Product 1', price: 1000 },
      { _id: '2', name: 'Product 2', price: 2000 }
    ];

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(2);
  });

  it('should navigate on row click when clickable and rowRoute defined', () => {
    const config: DynamicTableConfig = {
      columns: [{ key: 'name', label: 'Name' }],
      clickable: true,
      rowRoute: '/products',
      idField: '_id'
    };

    const data = [{ _id: '123', name: 'Product 1' }];

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tr[mat-row]');
    row?.click();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products', '123']);
  });

  it('should emit rowClick event on row click', () => {
    const config: DynamicTableConfig = {
      columns: [{ key: 'name', label: 'Name' }],
      clickable: true
    };

    const data = [{ _id: '123', name: 'Product 1' }];

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', data);

    let emittedEvent: any;
    component.rowClick.subscribe((event) => {
      emittedEvent = event;
    });

    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tr[mat-row]');
    row?.click();

    expect(emittedEvent).toBeDefined();
    expect(emittedEvent.id).toBe('123');
    expect(emittedEvent.row.name).toBe('Product 1');
  });

  it('should format currency cells correctly', () => {
    const config: DynamicTableConfig = {
      columns: [
        { key: 'price', label: 'Price', type: 'currency' }
      ]
    };

    const data = [{ _id: '1', price: 5000 }];

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const cell = fixture.nativeElement.querySelector('td[mat-cell]');
    expect(cell?.textContent?.trim()).toBe('5000 Ar');
  });

  it('should format boolean cells correctly', () => {
    const config: DynamicTableConfig = {
      columns: [
        { key: 'active', label: 'Active', type: 'boolean' }
      ]
    };

    const data = [
      { _id: '1', active: true },
      { _id: '2', active: false }
    ];

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('td[mat-cell]');
    expect(cells[0]?.textContent?.trim()).toBe('Oui');
    expect(cells[1]?.textContent?.trim()).toBe('Non');
  });

  it('should apply custom cell class', () => {
    const config: DynamicTableConfig = {
      columns: [
        {
          key: 'status',
          label: 'Status',
          cellClass: (row: any) => row.status === 'active' ? 'text-green' : 'text-red'
        }
      ]
    };

    const data = [{ _id: '1', status: 'active' }];

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const cell = fixture.nativeElement.querySelector('td[mat-cell]');
    expect(cell?.classList.contains('text-green')).toBe(true);
  });

  it('should show actions column when configured', () => {
    const config: DynamicTableConfig = {
      columns: [{ key: 'name', label: 'Name' }],
      showActions: true,
      actions: [
        {
          label: 'Edit',
          icon: 'edit',
          handler: () => {}
        }
      ]
    };

    const data = [{ _id: '1', name: 'Product 1' }];

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const actionButtons = fixture.nativeElement.querySelectorAll('.actions-cell button');
    expect(actionButtons.length).toBeGreaterThan(0);
  });

  it('should hide invisible columns', () => {
    const config: DynamicTableConfig = {
      columns: [
        { key: 'name', label: 'Name', visible: true },
        { key: 'secret', label: 'Secret', visible: false }
      ]
    };

    const data = [{ _id: '1', name: 'Product 1', secret: 'hidden' }];

    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('th[mat-header-cell]');
    expect(headers.length).toBe(1);
    expect(headers[0]?.textContent?.trim()).toBe('Name');
  });
});
