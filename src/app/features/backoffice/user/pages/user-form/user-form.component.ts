import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
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
export class UserFormComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  
  protected readonly isLoading = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly userId = signal<string | null>(null);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);

  protected readonly formConfig = signal<DynamicFormConfig>({
    mode: 'create', 
    submitLabel: 'Enregistrer',
    cancelLabel: 'Annuler',
    fields: [
      { key: 'name', label: 'Nom', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'password', label: 'Mot de passe', type: 'password', required: true },
      { 
        key: 'role', 
        label: 'Rôle', 
        type: 'select', 
        required: true,
        options: [
          { value: 'CLIENT', label: 'Client' },
          { value: 'BOUTIQUE', label: 'Boutique' },
          { value: 'ADMIN', label: 'Administrateur' }
        ]
      }
    ]
  });

  private returnTo: string | null = null;

  ngOnInit(): void {
    // Check for returnTo query param
    this.route.queryParams.subscribe(params => {
      this.returnTo = params['returnTo'] || null;

      // If we are creating a "propriétaire" for a magasin,
      // default the role to BOUTIQUE and lock it.
      if (this.returnTo === 'magasin' && !this.isEditMode()) {
        this.userData.set({ role: 'BOUTIQUE' });
        this.formConfig.update(config => ({
          ...config,
          fields: config.fields.map(field =>
            field.key === 'role'
              ? { ...field, disabled: true }
              : field
          )
        }));
      }
    });

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'nouveau') {
        this.isEditMode.set(true);
        this.userId.set(id);
        this.loadUser(id);
        // En mode édition, le password devient optionnel
        this.formConfig.update(config => ({
          ...config,
          mode: 'edit',
          fields: config.fields.map(field => 
            field.key === 'password' 
              ? { ...field, required: false, placeholder: 'Laisser vide pour ne pas modifier' }
              : field
          )
        }));
      }
    });
  }

  private loadUser(id: string): void {
    this.isLoading.set(true);
    this.userService.getById(id).subscribe({
      next: (data) => {
        // Ne pas inclure le password dans les données initiales
        const { password, ...userDataWithoutPassword } = data;
        this.userData.set(userDataWithoutPassword);
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
    
    // En mode édition, ne pas envoyer le password s'il est vide
    const submitData = { ...data };
    if (this.isEditMode() && !submitData['password']) {
      delete submitData['password'];
    }

    const operation = this.isEditMode()
      ? this.userService.update(this.userId()!, submitData)
      : this.userService.create(submitData);

    operation.subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        const message = this.isEditMode() 
          ? 'Utilisateur modifié avec succès' 
          : 'Utilisateur créé avec succès';
        
        this.snackBar.open(message, 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        
        // If we created a new owner from the magasin flow,
        // redirect back to magasin form and preselect the created user.
        if (!this.isEditMode() && this.returnTo === 'magasin') {
          const createdId =
            response?._id ??
            response?.id ??
            response?.user?._id ??
            response?.user?.id;

          if (createdId) {
            this.router.navigate(['/magasins/nouveau'], {
              queryParams: { ownerId: createdId }
            });
            return;
          }
        }

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
    const user = this.userData();
    const nom = user?.['name'] || 'cet élément';
    
    if (confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) {
      this.isLoading.set(true);
      this.userService.delete(this.userId()!).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Utilisateur supprimé avec succès', 'Fermer', {
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
    if (this.returnTo === 'magasin') {
      this.router.navigate(['/magasins/nouveau']);
    } else {
      this.router.navigate(['/users']);
    }
  }
}
