import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { LoyerBoxService } from '../loyer-box.service';
import { BoxService } from '../../box/box.service';

@Component({
  selector: 'app-loyer-box-form',
  standalone: true,
  templateUrl: './loyer-box-form.component.html',
  styleUrl: './loyer-box-form.component.scss',
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
export class LoyerBoxFormComponent implements OnInit {
  private readonly loyerBoxService = inject(LoyerBoxService);
  private readonly boxService = inject(BoxService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  
  protected readonly isLoading = signal(false);
  protected readonly boxId = signal<string>('');
  protected readonly boxName = signal<string>('');

  protected readonly formConfig = signal<DynamicFormConfig>({
    mode: 'create', 
    submitLabel: 'Cr\u00e9er le loyer',
    cancelLabel: 'Annuler',
    fields: [
      { key: 'montantLoyer', label: 'Montant du loyer (Ar)', type: 'number', required: true, min: 0 },
      { key: 'dateDebut', label: 'Date de d\u00e9but', type: 'date', required: true },
      { key: 'dateFin', label: 'Date de fin (optionnel)', type: 'date', required: false }
    ]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const boxId = params['boxId'];
      if (boxId) {
        this.boxId.set(boxId);
        this.loadBoxName(boxId);
      }
    });
  }

  private loadBoxName(boxId: string): void {
    this.boxService.getById(boxId).subscribe({
      next: (box) => {
        this.boxName.set(box.nomBox);
      },
      error: () => {
        this.boxName.set('Box inconnu');
      }
    });
  }

  onSubmit(data: Record<string, unknown>): void {
    this.isLoading.set(true);

    const loyerData = {
      ...data,
      box: this.boxId()
    };

    this.loyerBoxService.create(loyerData as any).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Loyer cr\u00e9\u00e9 avec succ\u00e8s', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.goBack();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors de la cr\u00e9ation du loyer', 'Fermer', {
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
    this.router.navigate(['/boxs', this.boxId(), 'loyers']);
  }
}
