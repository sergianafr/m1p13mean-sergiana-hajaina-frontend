import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TitleComponent } from '../../../shared/components/title/title.component';
import { AuthService } from '../../../core/services/auth.service';
import { Magasin, MagasinService } from '../magasin/magasin.service';
import { BoxMagasinService, MagasinBox } from '../box-magasin/box-magasin.service';
import { PaiementLoyerService } from './paiement-loyer.service';

@Component({
  selector: 'app-paiement-loyer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TitleComponent,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './paiement-loyer-form.component.html',
  styleUrl: './paiement-loyer-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaiementLoyerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly magasinService = inject(MagasinService);
  private readonly boxMagasinService = inject(BoxMagasinService);
  private readonly paiementService = inject(PaiementLoyerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly magasins = signal<Magasin[]>([]);
  protected readonly associations = signal<MagasinBox[]>([]);
  protected readonly totalBoxesActifs = signal(0);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly years = Array.from({ length: 7 }, (_, index) => this.currentYear - index);
  protected readonly months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  protected readonly form = this.fb.nonNullable.group({
    magasin: ['', Validators.required],
    mois: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
    annee: [this.currentYear, [Validators.required, Validators.min(1900)]],
    datePaiement: [new Date().toISOString().slice(0, 10), Validators.required]
  });

  ngOnInit(): void {
    this.loadReferenceData();

    this.form.get('magasin')?.valueChanges.subscribe(() => this.computeEstimatedTotal());
    this.form.get('mois')?.valueChanges.subscribe(() => this.computeEstimatedTotal());
    this.form.get('annee')?.valueChanges.subscribe(() => this.computeEstimatedTotal());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.paiementService.createPaiement(this.form.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Paiement enregistré avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/paiement-loyers']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.snackBar.open(error?.error?.message ?? 'Erreur lors de l\'enregistrement', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  protected goBack(): void {
    this.router.navigate(['/paiement-loyers']);
  }

  private loadReferenceData(): void {
    this.isLoading.set(true);

    const magasinsRequest = this.authService.hasRole('ADMIN')
      ? this.magasinService.getAll().pipe(catchError(() => of([] as Magasin[])))
      : this.magasinService.getMine().pipe(catchError(() => of([] as Magasin[])));

    magasinsRequest.subscribe({
      next: (magasins) => {
        this.magasins.set(magasins);

        this.boxMagasinService.getAll().pipe(catchError(() => of([] as MagasinBox[]))).subscribe({
          next: (associations) => {
            const allowedMagasinIds = new Set(magasins.map(m => String(m._id)));
            this.associations.set(
              associations.filter(association => allowedMagasinIds.has(this.extractId((association as any).magasin)))
            );

            if (this.authService.hasRole('BOUTIQUE') && magasins.length === 1) {
              this.form.patchValue({ magasin: magasins[0]._id ?? '' }, { emitEvent: false });
            }

            this.computeEstimatedTotal();
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
            this.snackBar.open('Erreur lors du chargement des assignations', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement des magasins', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private computeEstimatedTotal(): void {
    const magasinId = this.form.getRawValue().magasin;
    const mois = Number(this.form.getRawValue().mois);
    const annee = Number(this.form.getRawValue().annee);

    if (!magasinId || !mois || !annee) {
      this.totalBoxesActifs.set(0);
      return;
    }

    const start = new Date(annee, mois - 1, 1, 0, 0, 0, 0);
    const end = new Date(annee, mois, 0, 23, 59, 59, 999);

    const boxIds = [...new Set(
      this.associations()
        .filter(association => {
          const assocMagasinId = this.extractId((association as any).magasin);
          if (assocMagasinId !== magasinId) return false;

          const dateDebut = new Date((association as any).dateDebut);
          const dateFinRaw = (association as any).dateFin;
          const dateFin = dateFinRaw ? new Date(dateFinRaw) : null;
          return this.isOverlapping(dateDebut, dateFin, start, end);
        })
        .map(association => this.extractId((association as any).box))
        .filter(Boolean)
    )];

    this.totalBoxesActifs.set(boxIds.length);
  }

  private extractId(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;

    const record = value as Record<string, unknown>;
    return typeof record['_id'] === 'string' ? String(record['_id']) : '';
  }

  private isOverlapping(startA: Date, endA: Date | null, startB: Date, endB: Date): boolean {
    const normalizedEndA = endA ?? new Date('9999-12-31T23:59:59.999Z');
    return startA <= endB && startB <= normalizedEndA;
  }
}
