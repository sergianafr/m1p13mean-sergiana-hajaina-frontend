import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { StockService, MvtStock } from '../../stock.service';
import { MagasinService } from '../../../magasin/magasin.service';
import { ProduitService, Produit } from '../../../produit/produit.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-stock-form',
  standalone: true,
  templateUrl: './stock-form.component.html',
  styleUrl: './stock-form.component.scss',
  imports: [
    CommonModule,
    DynamicFormComponent,
    TitleComponent,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockFormComponent implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly magasinService = inject(MagasinService);
  private readonly produitService = inject(ProduitService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(false);
  protected readonly isHistoryMode = signal(false);
  protected readonly produitId = signal<string | null>(null);
  protected readonly produitName = signal<string>('');
  protected readonly stockActuel = signal<number>(0);
  protected readonly mouvements = signal<MvtStock[]>([]);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);
  protected readonly produits = signal<Produit[]>([]);

  protected readonly formConfig = signal<DynamicFormConfig>({
    mode: 'create',
    submitLabel: 'Enregistrer l\'entrée',
    cancelLabel: 'Annuler',
    fields: [
      {
        key: 'produit',
        label: 'Produit',
        type: 'select',
        required: true,
        options: []
      },
      {
        key: 'qteEntree',
        label: 'Quantité entrée',
        type: 'number',
        required: true,
        min: 1,
        hint: 'Nombre d\'unités à ajouter au stock'
      }
    ]
  });

  ngOnInit(): void {
    const snapshot = this.route.snapshot;

    // Check if we're in history mode: /stocks/historique/:produitId
    if (snapshot.url.some(seg => seg.path === 'historique')) {
      this.isHistoryMode.set(true);
      const pId = snapshot.paramMap.get('produitId');
      if (pId) {
        this.produitId.set(pId);
        this.loadHistory(pId);
      }
      return;
    }

    // Entry mode: /stocks/entree or /stocks/entree/:produitId
    const produitIdParam = snapshot.paramMap.get('produitId');
    if (produitIdParam) {
      this.produitId.set(produitIdParam);
      // Pre-select produit and load its unite
      this.loadProduitAndSetForm(produitIdParam);
    } else {
      this.loadProduitOptions();
    }
  }

  private loadProduitOptions(): void {
    this.magasinService.getMine().subscribe({
      next: (magasins) => {
        if (magasins.length === 0) return;
        // Get all produits from all magasins
        const requests = magasins.map(m =>
          this.stockService.getStockByMagasin(m._id!)
        );
        forkJoin(requests).subscribe({
          next: (results) => {
            const allProduits = results.flat();
            this.produits.set(allProduits as any);
            this.formConfig.update(config => ({
              ...config,
              fields: config.fields.map(f => {
                if (f.key === 'produit') {
                  return {
                    ...f,
                    options: allProduits.map(p => ({
                      value: p._id,
                      label: `${p.nomProduit} (stock: ${p.stockActuel})`
                    }))
                  };
                }
                return f;
              })
            }));
          }
        });
      }
    });
  }

  private loadProduitAndSetForm(produitId: string): void {
    this.produitService.getById(produitId).subscribe({
      next: (produit) => {
        this.produitName.set(produit.nomProduit);
        this.userData.set({ produit: produitId });
        this.formConfig.update(config => ({
          ...config,
          fields: config.fields.map(f => {
            if (f.key === 'produit') {
              return {
                ...f,
                options: [{ value: produitId, label: produit.nomProduit }],
                disabled: true
              };
            }
            return f;
          })
        }));
      }
    });
  }

  private loadHistory(produitId: string): void {
    this.isLoading.set(true);
    forkJoin({
      produit: this.produitService.getById(produitId),
      stock: this.stockService.getStockByProduit(produitId),
      mouvements: this.stockService.getMvtsByProduit(produitId)
    }).subscribe({
      next: ({ produit, stock, mouvements }) => {
        this.produitName.set(produit.nomProduit);
        this.stockActuel.set(stock.stock);
        this.mouvements.set(mouvements);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
      }
    });
  }

  protected onSubmit(data: Record<string, unknown>): void {
    const produitId = data['produit'] as string;
    const qteEntree = Number(data['qteEntree']);

    if (!produitId || !qteEntree || qteEntree <= 0) {
      this.snackBar.open('Veuillez remplir tous les champs', 'Fermer', { duration: 3000 });
      return;
    }

    // Need to get the produit's unite
    this.isLoading.set(true);
    this.produitService.getById(produitId).subscribe({
      next: (produit) => {
        const uniteId = typeof produit.unite === 'object'
          ? (produit.unite as any)._id
          : produit.unite;

        this.stockService.createMvtStock({
          produit: produitId,
          unite: uniteId,
          qteEntree
        }).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.snackBar.open('Entrée de stock enregistrée', 'OK', { duration: 3000 });
            this.router.navigate(['/stocks']);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 });
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors de la récupération du produit', 'Fermer', { duration: 3000 });
      }
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/stocks']);
  }

  protected onGoBack(): void {
    this.router.navigate(['/stocks']);
  }

  protected formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
