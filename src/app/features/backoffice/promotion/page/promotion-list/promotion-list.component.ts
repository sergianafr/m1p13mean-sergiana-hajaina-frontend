import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PromotionService, Promotion } from '../../promotion.service';
import { DynamicTableComponent, ListHeaderComponent } from '../../../../../shared';
import { DynamicTableConfig } from '../../../../../shared/models/table-config.model';

@Component({
  selector: 'app-promotion-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSnackBarModule,
    DynamicTableComponent,
    ListHeaderComponent
  ],
  templateUrl: './promotion-list.component.html',
  styleUrl: './promotion-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromotionListComponent implements OnInit {
  private readonly promotionService = inject(PromotionService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly promotions = signal<Promotion[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly tableConfig = computed<DynamicTableConfig>(() => ({
    columns: [
      {
        key: 'produit',
        label: 'Produit',
        format: (value) => this.getRelationName(value, 'nomProduit')
      },
      {
        key: 'magasin',
        label: 'Magasin',
        format: (value) => this.getRelationName(value, 'nomMagasin')
      },
      {
        key: 'pourcentage',
        label: 'Remise (%)',
        type: 'number',
        align: 'center',
        format: (value) => value ? `${value}%` : '0%'
      },
      {
        key: 'qte',
        label: 'Quantité',
        type: 'number',
        align: 'center',
        format: (value) => {
          const qty = typeof value === 'number' ? value : -1;
          return qty === -1 ? 'Illimitée' : qty.toString();
        }
      },
      {
        key: 'dateDebut',
        label: 'Date début',
        type: 'date',
        format: (value) => this.formatDate(value)
      },
      {
        key: 'dateFin',
        label: 'Date fin',
        type: 'date',
        format: (value) => this.formatDate(value)
      }
    ],
    clickable: true,
    loading: this.isLoading(),
    rowRoute: '/promotions',
    idField: '_id',
    emptyMessage: 'Aucune promotion trouvée',
    pageable: true,
    pageSize: 10
  }));

  ngOnInit(): void {
    this.loadPromotions();
  }

  private loadPromotions(): void {
    this.isLoading.set(true);
    this.promotionService.getAll().subscribe({
      next: (data) => {
        this.promotions.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement des promotions', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  protected onCreate(): void {
    this.router.navigate(['/promotions/nouvelle']);
  }

  protected onEdit(promotion: Promotion): void {
    this.router.navigate(['/promotions', promotion._id]);
  }

  protected onDelete(promotion: Promotion): void {
    const identifier = promotion.produit?.nomProduit || promotion.magasin?.nomMagasin || 'cette promotion';
    if (confirm(`Voulez-vous vraiment supprimer la promotion pour "${identifier}" ?`)) {
      this.isLoading.set(true);
      this.promotionService.delete(promotion._id!).subscribe({
        next: () => {
          this.snackBar.open('Promotion supprimée avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadPromotions();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          console.error('Erreur:', error);
        }
      });
    }
  }

  private getRelationName(value: unknown, property: 'nomProduit' | 'nomMagasin'): string {
    if (!value) {
      return '-';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const relation = value as Record<string, unknown>;
      const relationName = relation[property];

      if (typeof relationName === 'string' && relationName.trim().length > 0) {
        return relationName;
      }
    }

    return '-';
  }

  private formatDate(value: unknown): string {
    if (!value) return '-';
    const date = new Date(value as string);
    return date.toLocaleDateString('fr-FR');
  }
}
