import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { PromotionService, PromotionDTO } from '../../promotion.service';
import { ProduitService } from '../../../produit/produit.service';
import { MagasinService } from '../../../magasin/magasin.service';

@Component({
  selector: 'app-promotion-form',
  standalone: true,
  templateUrl: './promotion-form.component.html',
  styleUrl: './promotion-form.component.scss',
  imports: [
    DynamicFormComponent,
    TitleComponent,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatButtonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromotionFormComponent implements OnInit {
  private readonly promotionService = inject(PromotionService);
  private readonly produitService = inject(ProduitService);
  private readonly magasinService = inject(MagasinService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly promotionId = signal<string | null>(null);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);

  protected readonly formConfig = signal<DynamicFormConfig>({
    mode: 'create',
    submitLabel: 'Enregistrer',
    cancelLabel: 'Annuler',
    fields: [
      {
        key: 'typePromotion',
        label: 'Type de promotion',
        type: 'select',
        required: true,
        options: [
          { value: 'produit', label: 'Promotion sur un produit' },
          { value: 'magasin', label: 'Promotion sur un magasin' }
        ]
      },
      {
        key: 'produit',
        label: 'Produit',
        type: 'select',
        options: []
      },
      {
        key: 'magasin',
        label: 'Magasin',
        type: 'select',
        options: []
      },
      {
        key: 'pourcentage',
        label: 'Pourcentage de remise (%)',
        type: 'number',
        required: true,
        min: 0,
        max: 100,
        hint: 'Entre 0 et 100'
      },
      {
        key: 'qte',
        label: 'Quantité',
        type: 'number',
        min: -1,
        hint: 'Laisser -1 pour une quantité illimitée'
      },
      {
        key: 'dateDebut',
        label: 'Date de début',
        type: 'date',
        required: true
      },
      {
        key: 'dateFin',
        label: 'Date de fin',
        type: 'date',
        required: true
      }
    ]
  });

  ngOnInit(): void {
    this.loadSelectOptions();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'nouvelle') {
        this.isEditMode.set(true);
        this.promotionId.set(id);
        this.loadPromotion(id);
        this.formConfig.update(config => ({ ...config, mode: 'edit' }));
      }
    });
  }

  private loadSelectOptions(): void {
    this.isLoading.set(true);

    forkJoin({
      produits: this.produitService.getAll(),
      magasins: this.magasinService.getAll()
    }).subscribe({
      next: (data) => {
        this.formConfig.update(config => ({
          ...config,
          fields: config.fields.map(field => {
            if (field.key === 'produit') {
              return {
                ...field,
                options: data.produits.map(p => ({
                  value: p._id!,
                  label: p.nomProduit
                }))
              };
            }
            if (field.key === 'magasin') {
              return {
                ...field,
                options: data.magasins.map(m => ({
                  value: m._id!,
                  label: m.nomMagasin
                }))
              };
            }
            return field;
          })
        }));
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement des options', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  private loadPromotion(id: string): void {
    this.isLoading.set(true);
    this.promotionService.getById(id).subscribe({
      next: (data) => {
        const typePromotion = data.produit ? 'produit' : 'magasin';
        const formData = {
          typePromotion,
          produit: typeof data.produit === 'string' ? data.produit : data.produit?._id,
          magasin: typeof data.magasin === 'string' ? data.magasin : data.magasin?._id,
          pourcentage: data.pourcentage,
          qte: data.qte,
          dateDebut: this.formatDateForInput(data.dateDebut),
          dateFin: this.formatDateForInput(data.dateFin)
        };
        this.userData.set(formData);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
        this.goBack();
      }
    });
  }

  onSubmit(data: Record<string, unknown>): void {
    this.isLoading.set(true);

    const dto: PromotionDTO = {
      pourcentage: data['pourcentage'] as number,
      qte: (data['qte'] as number) ?? -1,
      dateDebut: new Date(data['dateDebut'] as string),
      dateFin: new Date(data['dateFin'] as string)
    };

    const typePromotion = data['typePromotion'] as string;
    if (typePromotion === 'produit') {
      dto.produit = data['produit'] as string;
    } else if (typePromotion === 'magasin') {
      dto.magasin = data['magasin'] as string;
    }

    if (this.isEditMode()) {
      this.promotionService.update(this.promotionId()!, dto as any).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Promotion modifiée avec succès', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.goBack();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.snackBar.open('Erreur lors de la modification', 'Fermer', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          console.error('Erreur:', error);
        }
      });
    } else {
      this.promotionService.create(dto as any).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Promotion créée avec succès', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.goBack();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.snackBar.open('Erreur lors de la création', 'Fermer', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          console.error('Erreur:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.goBack();
  }

  onGoBack(): void {
    this.goBack();
  }

  onDelete(): void {
    const promotion = this.userData();
    const identifier = 'cette promotion';

    if (confirm(`Voulez-vous vraiment supprimer "${identifier}" ?`)) {
      this.isLoading.set(true);
      this.promotionService.delete(this.promotionId()!).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Promotion supprimée avec succès', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.goBack();
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

  private goBack(): void {
    this.router.navigate(['/promotions']);
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
