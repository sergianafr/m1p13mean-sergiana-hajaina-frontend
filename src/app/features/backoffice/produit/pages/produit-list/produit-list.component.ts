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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin, map, Observable } from 'rxjs';
import { ProduitService, Produit } from '../../produit.service';
import { MagasinService } from '../../../magasin/magasin.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { DynamicTableComponent, ListHeaderComponent } from '../../../../../shared';
import { DynamicTableConfig } from '../../../../../shared/models/table-config.model';
import { PrixDialogComponent } from '../../components/prix-dialog/prix-dialog.component';

@Component({
  selector: 'app-produit-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    DynamicTableComponent,
    ListHeaderComponent
  ],
  templateUrl: './produit-list.component.html',
  styleUrl: './produit-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProduitListComponent implements OnInit {
  private readonly produitService = inject(ProduitService);
  private readonly magasinService = inject(MagasinService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly produits = signal<Produit[]>([]);
  protected readonly isLoading = signal(false);
  protected get isBoutique(): boolean {
    return this.authService.hasRole('BOUTIQUE');
  }

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
        type: 'image',
        align: 'center',
        format: (value) => {
          if (!Array.isArray(value) || value.length === 0) {
            return '';
          }

          const first = value[0] as { url?: unknown };
          return typeof first?.url === 'string' ? first.url : '';
        }
      }
    ],
    clickable: true,
    loading: this.isLoading(),
    rowRoute: '/produits',
    idField: '_id',    showActions: true,
    actions: [
      {
        label: 'Prix',
        icon: 'payments',
        color: 'primary',
        handler: (row: unknown) => {
          const p = row as Produit;
          this.openPrixDialog(p);
        }
      },
      {
        label: 'Stock',
        icon: 'inventory',
        color: 'accent',
        handler: (row: unknown) => {
          const p = row as Produit;
          this.router.navigate(['/stocks/historique', p._id]);
        }
      }
    ],    emptyMessage: 'Aucun produit trouvé',
    pageable: true,
    pageSize: 10
  }));

  ngOnInit(): void {
    this.loadProduits();
  }

  private loadProduits(): void {
    this.isLoading.set(true);

    const request$: Observable<Produit[]> = this.isBoutique
      ? forkJoin({
          produits: this.produitService.getAll(),
          magasins: this.magasinService.getMine()
        }).pipe(
          map(({ produits, magasins }) => {
            const userMagasinIds = new Set(
              magasins
                .map((magasin) => magasin._id)
                .filter((id): id is string => typeof id === 'string' && id.length > 0)
            );

            return produits.filter((produit) => userMagasinIds.has(this.getMagasinId(produit.magasin)));
          })
        )
      : this.produitService.getAll();

    request$.subscribe({
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

  private getMagasinId(value: Produit['magasin']): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value && typeof value === 'object' && typeof value._id === 'string') {
      return value._id;
    }

    return '';
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

  protected openPrixDialog(produit: Produit): void {
    this.dialog.open(PrixDialogComponent, {
      width: '700px',
      data: {
        produitId: produit._id,
        nomProduit: produit.nomProduit
      }
    });
  }
}
