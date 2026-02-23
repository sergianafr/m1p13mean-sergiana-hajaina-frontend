import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { TypeMagasinService } from '../../type-magasin.service';

@Component({
  selector: 'app-type-magasin-form',
  standalone: true,
  templateUrl: './type-magasin-form.component.html',
  styleUrl: './type-magasin-form.component.scss',
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
export class TypeMagasinFormComponent implements OnInit {
  private readonly typeMagasinService = inject(TypeMagasinService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  
  protected readonly isLoading = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly typeMagasinId = signal<string | null>(null);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);

  protected readonly formConfig = signal<DynamicFormConfig>({
    mode: 'create', 
    submitLabel: 'Enregistrer',
    cancelLabel: 'Annuler',
    fields: [
      { key: 'nomTypeMagasin', label: 'Nom du Type de Magasin', type: 'text', required: true }
    ]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'nouveau') {
        this.isEditMode.set(true);
        this.typeMagasinId.set(id);
        this.loadTypeMagasin(id);
        this.formConfig.update(config => ({
          ...config,
          mode: 'edit'
        }));
      }
    });
  }

  private loadTypeMagasin(id: string): void {
    this.isLoading.set(true);
    this.typeMagasinService.getById(id).subscribe({
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
      ? this.typeMagasinService.update(this.typeMagasinId()!, data)
      : this.typeMagasinService.create(data);

    operation.subscribe({
      next: () => {
        this.isLoading.set(false);
        const message = this.isEditMode() 
          ? 'Type de magasin modifié avec succès' 
          : 'Type de magasin créé avec succès';
        
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

  private goBack(): void {
    this.router.navigate(['/type-magasins']);
  }
}
