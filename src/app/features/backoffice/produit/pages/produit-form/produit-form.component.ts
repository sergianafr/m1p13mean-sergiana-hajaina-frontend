import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { ProduitService, ProduitDTO } from '../../produit.service';
import { TypeProduitService } from '../../../type-produit/type-produit.service';
import { UniteService } from '../../../unite/unite.service';
import { MagasinService } from '../../../magasin/magasin.service';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-produit-form',
  standalone: true,
  templateUrl: './produit-form.component.html',
  styleUrl: './produit-form.component.scss',
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
export class ProduitFormComponent implements OnInit {
  private readonly produitService = inject(ProduitService);
  private readonly typeProduitService = inject(TypeProduitService);
  private readonly uniteService = inject(UniteService);
  private readonly magasinService = inject(MagasinService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  
  protected readonly isLoading = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly produitId = signal<string | null>(null);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);

  protected readonly formConfig = signal<DynamicFormConfig>({
    mode: 'create', 
    submitLabel: 'Enregistrer',
    cancelLabel: 'Annuler',
    fields: [
      { 
        key: 'nomProduit', 
        label: 'Nom du produit', 
        type: 'text', 
        required: true 
      },
      { 
        key: 'descriptionProduit', 
        label: 'Description', 
        type: 'textarea', 
        rows: 4 
      },
      { 
        key: 'seuilNotification', 
        label: 'Seuil de notification', 
        type: 'number', 
        min: 0 
      },
      { 
        key: 'unite', 
        label: 'Unité', 
        type: 'select', 
        required: true,
        options: []
      },
      { 
        key: 'typeProduit', 
        label: 'Type de produit', 
        type: 'select', 
        required: true,
        options: []
      },
      { 
        key: 'magasin', 
        label: 'Magasin', 
        type: 'select', 
        required: true,
        options: []
      },
      {
        key: 'prixUnitaire',
        label: 'Prix unitaire (Ar)',
        type: 'number',
        min: 0,
        hint: 'Prix initial du produit'
      },
      { 
        key: 'photos', 
        label: 'Photos du produit', 
        type: 'file', 
        multiple: true,
        accept: 'image/*',
        existingImageField: 'photos',
        imageDeleteQueryParam: 'imageUrl',
        hint: 'Vous pouvez sélectionner jusqu\'a 5 images'
      }
    ]
  });

  ngOnInit(): void {
    this.loadSelectOptions();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'nouveau') {
        this.isEditMode.set(true);
        this.produitId.set(id);
        this.loadProduit(id);
        this.formConfig.update(config => ({
          ...config,
          mode: 'edit',
          fields: config.fields.map((field) =>
            field.key === 'photos'
              ? {
                  ...field,
                  imageDeleteEndpoint: `/produits/${id}/photos`
                }
              : field
          )
        }));
      }
    });
  }

  private loadSelectOptions(): void {
    this.isLoading.set(true);

    const currentUser = this.authService.getCurrentUser();
    const magasins$ = currentUser?.role === 'BOUTIQUE'
      ? this.magasinService.getMine()
      : this.magasinService.getAll();
    
    forkJoin({
      unites: this.uniteService.getAll(),
      typeProduits: this.typeProduitService.getAll(),
      magasins: magasins$
    }).subscribe({
      next: (data) => {
        if (!this.isEditMode() && data.magasins.length === 1) {
          const onlyMagasinId = data.magasins[0]._id;
          if (onlyMagasinId) {
            this.userData.update((current) => ({
              ...(current ?? {}),
              magasin: onlyMagasinId
            }));
          }
        }

        this.formConfig.update(config => ({
          ...config,
          fields: config.fields.map(field => {
            if (field.key === 'unite') {
              return {
                ...field,
                options: data.unites.map(u => ({ value: u._id!, label: u.nomUnite }))
              };
            }
            if (field.key === 'typeProduit') {

              return {
                ...field,
                options: data.typeProduits.map(tp => ({ value: tp._id!, label: tp.nomTypeProduit }))
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

  private loadProduit(id: string): void {
    this.isLoading.set(true);
    this.produitService.getById(id).subscribe({
      next: (data) => {
        const formData = {
          nomProduit: data.nomProduit,
          descriptionProduit: data.descriptionProduit,
          seuilNotification: data.seuilNotification,
          unite: typeof data.unite === 'string' ? data.unite : (data.unite as any)?._id,
          typeProduit: typeof data.typeProduit === 'string' ? data.typeProduit : (data.typeProduit as any)?._id,
          magasin: typeof data.magasin === 'string' ? data.magasin : (data.magasin as any)?._id,
          photos: data.photos ?? []
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

    const photos = data['photos'] as File[] | undefined;
    const dto: ProduitDTO = {
      nomProduit: data['nomProduit'] as string,
      descriptionProduit: data['descriptionProduit'] as string,
      seuilNotification: data['seuilNotification'] as number,
      unite: data['unite'] as string,
      typeProduit: data['typeProduit'] as string,
      magasin: data['magasin'] as string,
      prixUnitaire: data['prixUnitaire'] as number
    };

    console.log(data);
    if (this.isEditMode()) {
      this.produitService.updateWithPhotos(this.produitId()!, dto, photos || []).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Produit modifié avec succès', 'Fermer', {
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
      this.produitService.createWithPhotos(dto, photos || []).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Produit créé avec succès', 'Fermer', {
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
    const produit = this.userData();
    const nom = produit?.['nomProduit'] || 'cet élément';
    
    if (confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) {
      this.isLoading.set(true);
      this.produitService.delete(this.produitId()!).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Produit supprimé avec succès', 'Fermer', {
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
    this.router.navigate(['/produits']);
  }
}
