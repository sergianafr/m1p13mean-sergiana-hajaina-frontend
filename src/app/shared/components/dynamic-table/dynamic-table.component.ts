import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  DynamicTableConfig,
  ColumnConfig,
  TableRowClickEvent
} from '../../models/table-config.model';

@Component({
  selector: 'dynamic-table',
  standalone: true,
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule
  ]
})
export class DynamicTableComponent {
  private readonly router = inject(Router);

  // Inputs
  readonly config = input.required<DynamicTableConfig>();
  readonly data = input<unknown[]>([]);

  // Outputs
  readonly rowClick = output<TableRowClickEvent>();
  readonly pageChange = output<PageEvent>();
  readonly sortChange = output<Sort>();

  // Internal state
  protected readonly displayedColumns = computed(() => {
    const columns = this.config()
      .columns
      .filter(col => col.visible !== false)
      .map(col => col.key);
    
    if (this.config().showActions) {
      columns.push('actions');
    }
    
    return columns;
  });

  protected readonly visibleColumns = computed(() => 
    this.config().columns.filter(col => col.visible !== false)
  );

  protected readonly emptyMessage = computed(
    () => this.config().emptyMessage ?? 'Aucune donnée disponible'
  );

  protected readonly isLoading = computed(
    () => this.config().loading ?? false
  );

  protected readonly isClickable = computed(
    () => this.config().clickable ?? true
  );

  protected readonly idField = computed(
    () => this.config().idField ?? '_id'
  );

  protected readonly pageSize = computed(
    () => this.config().pageSize ?? 10
  );

  protected readonly totalItems = computed(
    () => this.config().totalItems ?? this.data().length
  );

  protected onRowClick(row: unknown): void {
    if (!this.isClickable()) return;

    const id = (row as Record<string, unknown>)[this.idField()];
    
    // Émettre l'événement
    this.rowClick.emit({ row, id: id as string | number });

    // Navigation automatique si rowRoute est défini
    const route = this.config().rowRoute;
    if (route) {
      this.router.navigate([route, id]);
    }
  }

  protected getCellValue(row: unknown, column: ColumnConfig): string {
    const value = (row as Record<string, unknown>)[column.key];
    
    // Format personnalisé
    if (column.format) {
      return column.format(value);
    }

    // Format par défaut selon le type
    switch (column.type) {
      case 'date':
        return value ? new Date(value as string).toLocaleDateString('fr-FR') : '';
      case 'boolean':
        return value ? 'Oui' : 'Non';
      case 'currency':
        return value ? `${value} Ar` : '0 Ar';
      case 'number':
        return value?.toString() ?? '';
      default:
        return value?.toString() ?? '';
    }
  }

  protected getCellClass(row: unknown, column: ColumnConfig): string {
    if (typeof column.cellClass === 'function') {
      return column.cellClass(row);
    }
    return column.cellClass ?? '';
  }

  protected isActionVisible(row: unknown, actionIndex: number): boolean {
    const action = this.config().actions?.[actionIndex];
    if (!action) return false;
    
    if (action.visible) {
      return action.visible(row);
    }
    
    return true;
  }

  protected handleAction(row: unknown, actionIndex: number, event: Event): void {
    event.stopPropagation(); // Empêcher le clic sur la ligne
    const action = this.config().actions?.[actionIndex];
    if (action) {
      action.handler(row);
    }
  }

  protected handlePageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  protected handleSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  protected getAlignment(column: ColumnConfig): string {
    return column.align ?? 'left';
  }
}
