import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DynamicTableComponent, ListHeaderComponent } from '../../../../../shared/components';
import { DynamicTableConfig } from '../../../../../shared/models';
import { AuthService } from '../../../../../core/services/auth.service';
import { MagasinService } from '../../../magasin/magasin.service';
import { Produit, ProduitService } from '../../../produit/produit.service';
import { AvisBackofficeService, AvisProduitBackoffice } from '../../avis-backoffice.service';

@Component({
  selector: 'app-avis-produit-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ListHeaderComponent,
    DynamicTableComponent,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './avis-produit-list.component.html',
  styleUrl: './avis-produit-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvisProduitListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly produitService = inject(ProduitService);
  private readonly magasinService = inject(MagasinService);
  private readonly avisBackofficeService = inject(AvisBackofficeService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly produits = signal<Produit[]>([]);
  protected readonly allAvis = signal<AvisProduitBackoffice[]>([]);
  protected readonly filteredAvis = signal<AvisProduitBackoffice[]>([]);
  protected readonly isLoading = signal(false);

  protected readonly filtersForm = this.fb.nonNullable.group({
    produitId: ['ALL']
  });

  protected readonly tableConfig = computed<DynamicTableConfig>(() => ({
    columns: [
      {
        key: 'produitInfo',
        label: 'Produit',
        sortable: true,
        format: value => {
          const produit = value as { nomProduit?: string } | null;
          return produit?.nomProduit || '-';
        }
      },
      {
        key: 'produitInfo',
        label: 'Magasin',
        sortable: true,
        format: value => {
          const produit = value as { nomMagasin?: string } | null;
          return produit?.nomMagasin || '-';
        }
      },
      {
        key: 'nombreEtoile',
        label: 'Note',
        sortable: true,
        align: 'center',
        format: value => this.formatStars(Number(value ?? 0))
      },
      {
        key: 'commentaire',
        label: 'Commentaire',
        format: value => String(value ?? '-').trim() || '-'
      },
      {
        key: 'appUser',
        label: 'Auteur',
        sortable: true,
        format: value => {
          const user = value as { name?: string } | null;
          return user?.name || '-';
        }
      },
      {
        key: 'dateAjout',
        label: 'Date',
        type: 'date',
        sortable: true
      }
    ],
    clickable: false,
    showActions: false,
    loading: this.isLoading(),
    emptyMessage: 'Aucun avis produit trouvé',
    pageable: true,
    pageSize: 10,
    totalItems: this.filteredAvis().length
  }));

  ngOnInit(): void {
    this.loadData();
  }

  protected applyFilters(): void {
    const produitId = this.filtersForm.getRawValue().produitId;

    if (produitId === 'ALL') {
      this.filteredAvis.set(this.allAvis());
      return;
    }

    this.filteredAvis.set(
      this.allAvis().filter(avis => avis.produitInfo?._id === produitId)
    );
  }

  protected resetFilters(): void {
    this.filtersForm.patchValue({ produitId: 'ALL' });
    this.filteredAvis.set(this.allAvis());
  }

  private loadData(): void {
    this.isLoading.set(true);

    if (this.authService.hasRole('ADMIN')) {
      this.produitService.getAll().subscribe({
        next: produits => this.loadAvisFromProduits(produits),
        error: () => this.handleLoadError('Erreur lors du chargement des produits')
      });
      return;
    }

    forkJoin({
      magasins: this.magasinService.getMine(),
      produits: this.produitService.getAll()
    }).subscribe({
      next: ({ magasins, produits }) => {
        const ownMagasinIds = new Set(
          magasins
            .map(magasin => String(magasin._id ?? ''))
            .filter(id => id.length > 0)
        );

        const produitsFiltres = produits.filter(produit => {
          const magasinValue = produit.magasin;

          if (typeof magasinValue === 'string') {
            return ownMagasinIds.has(magasinValue);
          }

          return ownMagasinIds.has(String(magasinValue?._id ?? ''));
        });

        this.loadAvisFromProduits(produitsFiltres);
      },
      error: () => this.handleLoadError('Erreur lors du chargement des données')
    });
  }

  private loadAvisFromProduits(produits: Produit[]): void {
    this.produits.set(produits);

    this.avisBackofficeService.getAvisProduitsByProduits(produits).subscribe({
      next: avis => {
        this.allAvis.set(avis);
        this.filteredAvis.set(avis);
        this.isLoading.set(false);
      },
      error: () => this.handleLoadError('Erreur lors du chargement des avis produits')
    });
  }

  private handleLoadError(message: string): void {
    this.isLoading.set(false);
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  private formatStars(value: number): string {
    const rating = Math.max(0, Math.min(5, Math.round(value)));
    return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
  }
}
