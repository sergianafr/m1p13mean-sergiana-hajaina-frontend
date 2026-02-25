import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { BoxService } from '../../box.service';

@Component({
  selector: 'app-box-form',
  standalone: true,
  templateUrl: './box-form.component.html',
  styleUrl: './box-form.component.scss',
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
export class BoxFormComponent implements OnInit {
  private readonly boxService = inject(BoxService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  
  protected readonly isLoading = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly boxId = signal<string | null>(null);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);

  protected readonly formConfig = signal<DynamicFormConfig>({
    mode: 'create', 
    submitLabel: 'Enregistrer',
    cancelLabel: 'Annuler',
    fields: [
      { key: 'nomBox', label: 'Nom du Box', type: 'text', required: true },
      { key: 'aireBox', label: 'Aire du Box (m²)', type: 'number', required: true }
    ]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'nouveau') {
        this.isEditMode.set(true);
        this.boxId.set(id);
        this.loadBox(id);
        this.formConfig.update(config => ({
          ...config,
          mode: 'edit'
        }));
      }
    });
  }

  private loadBox(id: string): void {
    this.isLoading.set(true);
    this.boxService.getById(id).subscribe({
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
      ? this.boxService.update(this.boxId()!, data)
      : this.boxService.create(data);

    operation.subscribe({
      next: () => {
        this.isLoading.set(false);
        const message = this.isEditMode() 
          ? 'Box modifié avec succès' 
          : 'Box créé avec succès';
        
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
    const box = this.userData();
    const nom = box?.['nomBox'] || 'cet élément';
    
    if (confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) {
      this.isLoading.set(true);
      this.boxService.delete(this.boxId()!).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Box supprimé avec succès', 'Fermer', {
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
    this.router.navigate(['/boxs']);
  }
}
