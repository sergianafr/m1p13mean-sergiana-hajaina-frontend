import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MagasinService, User, TypeMagasin } from '../../../magasin.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-magasin-form',
  standalone: true,
  templateUrl: './magasin-form.component.html',
  styleUrl: './magasin-form.component.scss',
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
export class MagasinFormComponent implements OnInit {
  private readonly magasinService = inject(MagasinService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  
  protected readonly isLoading = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly magasinId = signal<string | null>(null);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);

  private ownerId: string | null = null;

  protected readonly formConfig = signal<DynamicFormConfig>({
    mode: 'create', 
    submitLabel: 'Enregistrer',
    cancelLabel: 'Annuler',
    fields: [
      { key: 'nomMagasin', label: 'Nom du Magasin', type: 'text', required: true },
      { key: 'nif', label: 'NIF', type: 'text', required: false },
      { key: 'stat', label: 'STAT', type: 'text', required: false },
      { key: 'dateAjout', label: 'Date d\'ajout', type: 'date', required: false },
      { key: 'typeMagasin', label: 'Type de Magasin', type: 'select', required: true, options: [] },
      { 
        key: 'appUser', 
        label: 'Utilisateur', 
        type: 'user-search', 
        required: true, 
        searchData: [],
        searchFields: ['name', 'email'],
        placeholder: 'Rechercher par nom ou email'
      }
    ]
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.ownerId = params['ownerId'] || null;
      if (this.ownerId && !this.isEditMode()) {
        this.userData.set({
          ...(this.userData() ?? {}),
          appUser: this.ownerId
        });
      }
    });

    this.loadFormData();
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'nouveau') {
        this.isEditMode.set(true);
        this.magasinId.set(id);
        this.loadMagasin(id);
        this.formConfig.update(config => ({
          ...config,
          mode: 'edit'
        }));
      }
    });
  }

  private loadFormData(): void {
    this.isLoading.set(true);
    forkJoin({
      users: this.magasinService.getAllUsers(),
      typeMagasins: this.magasinService.getAllTypeMagasins()
    }).subscribe({
      next: ({ users, typeMagasins }) => {
        this.formConfig.update(config => ({
          ...config,
          fields: config.fields.map(field => {
            if (field.key === 'appUser') {
              return {
                ...field,
                searchData: users
              };
            }
            if (field.key === 'typeMagasin') {
              return {
                ...field,
                options: typeMagasins.map(t => ({ value: t._id, label: t.nomTypeMagasin }))
              };
            }
            return field;
          })
        }));
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement des données', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  private loadMagasin(id: string): void {
    this.isLoading.set(true);
    this.magasinService.getById(id).subscribe({
      next: (data) => {
        const formData = {
          ...data,
          appUser: typeof data.appUser === 'object' ? (data.appUser as any)._id : data.appUser,
          typeMagasin: typeof data.typeMagasin === 'object' ? (data.typeMagasin as any)._id : data.typeMagasin
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

    const operation = this.isEditMode()
      ? this.magasinService.update(this.magasinId()!, data)
      : this.magasinService.create(data);

    operation.subscribe({
      next: () => {
        this.isLoading.set(false);
        const message = this.isEditMode() 
          ? 'Magasin modifié avec succès' 
          : 'Magasin créé avec succès';
        
        this.snackBar.open(message, 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        
        this.goBack();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  onCancel(): void {
    this.goBack();
  }

  onGoBack(): void {
    this.goBack();
  }

  onDelete(): void {
    const magasin = this.userData();
    const nom = magasin?.['nomMagasin'] || 'cet élément';
    
    if (confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) {
      this.isLoading.set(true);
      this.magasinService.delete(this.magasinId()!).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Magasin supprimé avec succès', 'Fermer', {
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

  onCreateUser(): void {
    this.router.navigate(['/users/nouveau'], {
      queryParams: { returnTo: 'magasin' }
    });
  }

  private goBack(): void {
    this.router.navigate(['/magasins']);
  }
}
