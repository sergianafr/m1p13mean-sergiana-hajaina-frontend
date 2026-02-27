import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { UniteService } from '../../unite.service';

@Component({
  selector: 'app-unite-form',
  standalone: true,
  templateUrl: './unite-form.component.html',
  styleUrl: './unite-form.component.scss',
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
export class UniteFormComponent implements OnInit {
  private readonly uniteService = inject(UniteService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  
  protected readonly isLoading = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly uniteId = signal<string | null>(null);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);

  protected readonly formConfig = signal<DynamicFormConfig>({
    mode: 'create', 
    submitLabel: 'Enregistrer',
    cancelLabel: 'Annuler',
    fields: [
      { key: 'nomUnite', label: 'Nom de l\'Unité', type: 'text', required: true }
    ]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'nouveau') {
        this.isEditMode.set(true);
        this.uniteId.set(id);
        this.loadUnite(id);
        this.formConfig.update(config => ({
          ...config,
          mode: 'edit'
        }));
      }
    });
  }

  private loadUnite(id: string): void {
    this.isLoading.set(true);
    this.uniteService.getById(id).subscribe({
      next: (data) => {
        this.userData.set({ ...data });
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
      ? this.uniteService.update(this.uniteId()!, data)
      : this.uniteService.create(data);

    operation.subscribe({
      next: () => {
        this.isLoading.set(false);
        const message = this.isEditMode() 
          ? 'Unité modifiée avec succès' 
          : 'Unité créée avec succès';
        
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
    const unite = this.userData();
    const nom = unite?.['nomUnite'] || 'cet élément';
    
    if (confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) {
      this.isLoading.set(true);
      this.uniteService.delete(this.uniteId()!).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Unité supprimée avec succès', 'Fermer', {
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
    this.router.navigate(['/unites']);
  }
}
