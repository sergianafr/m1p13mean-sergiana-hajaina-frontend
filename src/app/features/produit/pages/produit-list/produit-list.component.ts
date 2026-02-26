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
import { ProduitService, Produit } from '../../produit.service';
import { DynamicTableComponent, ListHeaderComponent } from '../../../../shared';
import { DynamicTableConfig } from '../../../../shared/models/table-config.model';

@Component({
  selector: 'app-produit-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSnackBarModule,
    DynamicTableComponent,
    ListHeaderComponent
  ],
  templateUrl: './produit-list.component.html',
  styleUrl: './produit-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProduitListComponent implements OnInit {
  private readonly produitService = inject(ProduitService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly produits = signal<Produit[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly tableConfig = computed<DynamicTableConfig>(() => ({
    columns: [
      { key: 'nomProduit', label: 'Nom du produit', sortable: true },
      {
        key: 'descriptionProduit',
        label: 'Description',
        format: (value) => value?.toString() || '-'
      },
      {
        key: 'magasin',
        label: 'Magasin',
        format: (value) => this.getRelationName(value, 'nomMagasin')
      },
      {
        key: 'seuilNotification',
        label: 'Seuil de notification',
        type: 'number',
        align: 'center',
        format: (value) => (value === undefined || value === null ? '-' : value.toString())
      },
      {
        key: 'unite',
        label: 'Unité',
        format: (value) => this.getRelationName(value, 'nomUnite')
      },
      {
        key: 'photos',
        label: 'Photos',
        type: 'number',
        align: 'center',
        format: (value) => Array.isArray(value) ? value.length.toString() : '0'
      }
    ],
    actions: [
      {
        label: 'Modifier',
        icon: 'edit',
        color: 'primary',
        handler: (row) => this.onEdit(row as Produit)
      },
      {
        label: 'Supprimer',
        icon: 'delete',
        color: 'warn',
        handler: (row) => this.onDelete(row as Produit)
      }
    ],
    showActions: true,
    clickable: false,
    loading: this.isLoading(),
    emptyMessage: 'Aucun produit trouvé'
  }));

  ngOnInit(): void {
    this.loadProduits();
  }

  private loadProduits(): void {
    this.isLoading.set(true);
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement des produits', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  protected onCreate(): void {
    this.router.navigate(['/produits/nouveau']);
  }

  protected onEdit(produit: Produit): void {
    this.router.navigate(['/produits', produit._id]);
  }

  protected onDelete(produit: Produit): void {
    if (confirm(`Voulez-vous vraiment supprimer "${produit.nomProduit}" ?`)) {
      this.isLoading.set(true);
      this.produitService.delete(produit._id!).subscribe({
        next: () => {
          this.snackBar.open('Produit supprimé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadProduits();
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

  private getRelationName(value: unknown, property: 'nomMagasin' | 'nomUnite'): string {
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
}
