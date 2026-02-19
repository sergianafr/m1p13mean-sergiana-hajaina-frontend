import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TypeProduitService } from './type-produit.service';

@Component({
  selector: 'type-produit-form',
  standalone: true,
  templateUrl: './type-produit.component.html',
  styleUrl: './type-produit.component.scss',
  imports: [
    DynamicFormComponent,
    TitleComponent,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypeProduitForm {
  private readonly typeProduitService = inject(TypeProduitService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly isLoading = signal(false);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);

  protected readonly formConfig: DynamicFormConfig = {
    mode: 'create', 
    submitLabel: 'Enregistrer',
    fields: [
      { key: 'nomTypeProduit', label: 'Type de produit', type: 'text', required: true }
    ]
  };

  onSubmit(data: Record<string, unknown>): void {
    this.isLoading.set(true);
    
    this.typeProduitService.create(data).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.snackBar.open('Type de produit créé avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
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

  onCancel(): void {
    this.router.navigate(['/home']);
  }

  onGoBack(): void {
    this.router.navigate(['/home']);
  }
}