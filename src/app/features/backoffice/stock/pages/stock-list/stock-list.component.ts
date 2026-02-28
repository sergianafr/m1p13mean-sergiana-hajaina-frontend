import {
  ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { StockService, StockProduit } from '../../stock.service';
import { MagasinService, Magasin } from '../../../magasin/magasin.service';
import { DynamicTableComponent, ListHeaderComponent } from '../../../../../shared';
import { DynamicTableConfig } from '../../../../../shared/models/table-config.model';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatSnackBarModule, MatSelectModule,
    MatFormFieldModule, FormsModule,
    DynamicTableComponent, ListHeaderComponent
  ],
  templateUrl: './stock-list.component.html',
  styleUrl: './stock-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockListComponent implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly magasinService = inject(MagasinService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly stockProduits = signal<StockProduit[]>([]);
  protected readonly magasins = signal<Magasin[]>([]);
  protected readonly selectedMagasinId = signal<string>('');
  protected readonly isLoading = signal(false);

  protected readonly tableConfig = computed<DynamicTableConfig>(() => ({
    columns: [
      {
        key: 'photos', label: 'Photo', type: 'image', align: 'center', width: '80px',
        format: (value) => {
          if (!Array.isArray(value) || value.length === 0) return '';
          const first = value[0] as { url?: unknown };
          return typeof first?.url === 'string' ? first.url : '';
        }
      },
      { key: 'nomProduit', label: 'Produit', sortable: true },
      {
        key: 'typeProduit', label: 'Type',
        format: (value) => this.getRelationName(value, 'nomTypeProduit')
      },
      {
        key: 'unite', label: 'Unité',
        format: (value) => this.getRelationName(value, 'nomUnite')
      },
      {
        key: 'stockActuel', label: 'Stock actuel', type: 'number', align: 'center', sortable: true,
        cellClass: (row: unknown) => {
          const r = row as StockProduit;
          if (r.stockActuel <= 0) return 'stock-danger';
          if (r.seuilNotification && r.stockActuel <= r.seuilNotification) return 'stock-warning';
          return 'stock-ok';
        }
      },
      {
        key: 'seuilNotification', label: 'Seuil', type: 'number', align: 'center',
        format: (value) => (value === undefined || value === null ? '-' : value.toString())
      }
    ],
    showActions: true,
    actions: [
      {
        label: 'Entrée stock',
        icon: 'add_circle',
        color: 'primary',
        handler: (row: unknown) => {
          const p = row as StockProduit;
          this.router.navigate(['/stocks/entree', p._id]);
        }
      },
      {
        label: 'Historique',
        icon: 'history',
        color: 'accent',
        handler: (row: unknown) => {
          const p = row as StockProduit;
          this.router.navigate(['/stocks/historique', p._id]);
        }
      }
    ],
    clickable: false,
    loading: this.isLoading(),
    emptyMessage: 'Aucun produit trouvé pour cette boutique',
    pageable: true,
    pageSize: 10
  }));

  ngOnInit(): void {
    this.loadMagasins();
  }

  private loadMagasins(): void {
    this.magasinService.getMine().subscribe({
      next: (data) => {
        this.magasins.set(data);
        if (data.length > 0) {
          this.selectedMagasinId.set(data[0]._id!);
          this.loadStock();
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors du chargement des magasins', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadStock(): void {
    const magasinId = this.selectedMagasinId();
    if (!magasinId) return;
    this.isLoading.set(true);
    this.stockService.getStockByMagasin(magasinId).subscribe({
      next: (data) => { this.stockProduits.set(data); this.isLoading.set(false); },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement du stock', 'Fermer', { duration: 3000 });
      }
    });
  }

  onMagasinChange(magasinId: string): void {
    this.selectedMagasinId.set(magasinId);
    this.loadStock();
  }

  protected onNewEntry(): void {
    this.router.navigate(['/stocks/entree']);
  }

  private getRelationName(value: unknown, property: string): string {
    if (!value) return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      const relation = value as Record<string, unknown>;
      const name = relation[property];
      if (typeof name === 'string' && name.trim().length > 0) return name;
    }
    return '-';
  }
}
