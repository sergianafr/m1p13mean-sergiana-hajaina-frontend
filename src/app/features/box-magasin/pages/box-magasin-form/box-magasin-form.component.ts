import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TitleComponent } from '../../../../shared';
import { BoxService, Box } from '../../../box/box.service';
import { MagasinService, Magasin } from '../../../magasin.service';
import { BoxMagasinService, MagasinBox } from '../../box-magasin.service';
import { LoyerBoxService, LoyerBox } from '../../../loyer-box/loyer-box.service';

type BoxCard = Omit<Box, '_id'> & {
  _id: string;
  disponible: boolean;
  loyerActuel?: LoyerBox | null;
};

@Component({
  selector: 'app-box-magasin-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TitleComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './box-magasin-form.component.html',
  styleUrl: './box-magasin-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoxMagasinFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  private readonly boxService = inject(BoxService);
  private readonly magasinService = inject(MagasinService);
  private readonly service = inject(BoxMagasinService);
  private readonly loyerBoxService = inject(LoyerBoxService);

  protected readonly isLoading = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly associationId = signal<string | null>(null);

  protected readonly magasins = signal<Magasin[]>([]);
  protected readonly boxes = signal<BoxCard[]>([]);
  protected readonly selectedBoxId = signal<string | null>(null);

  private associations: MagasinBox[] = [];

  protected form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      magasin: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['']
    });

    this.loadBaseData();

    this.form.valueChanges.subscribe(() => {
      this.recomputeAvailability();
    });

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'nouveau') {
        this.isEditMode.set(true);
        this.associationId.set(id);
        this.loadAssociation(id);
      }
    });
  }

  private loadBaseData(): void {
    this.isLoading.set(true);

    forkJoin({
      magasins: this.magasinService.getAll().pipe(catchError(() => of([] as any))),
      boxes: this.boxService.getAll().pipe(catchError(() => of([] as any))),
      associations: this.service.getAll().pipe(catchError(() => of([] as any)))
    }).subscribe({
      next: ({ magasins, boxes, associations }) => {
        this.magasins.set(magasins as Magasin[]);
        this.associations = associations as MagasinBox[];

        const loyerRequests = (boxes as Box[]).map(b =>
          this.loyerBoxService.getCurrentByBox(b._id as string).pipe(catchError(() => of(null)))
        );

        forkJoin(loyerRequests).subscribe({
          next: (loyers) => {
            const cards: BoxCard[] = (boxes as Box[]).map((b, idx) => ({
              ...b,
              _id: b._id as string,
              loyerActuel: loyers[idx],
              disponible: true
            }));
            this.boxes.set(cards);
            this.recomputeAvailability();
            this.isLoading.set(false);
          },
          error: () => {
            const cards: BoxCard[] = (boxes as Box[]).map(b => ({
              ...b,
              _id: b._id as string,
              loyerActuel: null,
              disponible: true
            }));
            this.boxes.set(cards);
            this.recomputeAvailability();
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  private loadAssociation(id: string): void {
    this.isLoading.set(true);
    this.service.getById(id).subscribe({
      next: (assoc) => {
        const magasinId = (assoc as any)?.magasin?._id ?? (assoc as any)?.magasin;
        const boxId = (assoc as any)?.box?._id ?? (assoc as any)?.box;

        this.form.patchValue({
          magasin: magasinId,
          dateDebut: assoc.dateDebut ? new Date(assoc.dateDebut) : '',
          dateFin: assoc.dateFin ? new Date(assoc.dateFin) : ''
        });
        this.selectedBoxId.set(boxId ?? null);

        this.isLoading.set(false);
        this.recomputeAvailability();
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

  private recomputeAvailability(): void {
    const dateDebut = this.form?.get('dateDebut')?.value ? new Date(this.form.get('dateDebut')!.value) : null;
    const dateFinRaw = this.form?.get('dateFin')?.value;
    const dateFin = dateFinRaw ? new Date(dateFinRaw) : null;

    // If no start date yet, don't disable/blur boxes.
    if (!dateDebut) {
      this.boxes.update(list => list.map(b => ({ ...b, disponible: true })));
      return;
    }

    const currentId = this.associationId();

    this.boxes.update(list =>
      list.map(box => {
        const boxId = box._id as string;
        const overlap = this.associations.some(a => {
          const assocId = (a as any)._id;
          if (currentId && assocId === currentId) return false;

          const assocBoxId = (a as any)?.box?._id ?? (a as any)?.box;
          if (String(assocBoxId) !== String(boxId)) return false;

          const aStart = a.dateDebut ? new Date(a.dateDebut) : null;
          const aEnd = a.dateFin ? new Date(a.dateFin) : null;
          if (!aStart) return false;

          return this.isOverlapping(aStart, aEnd, dateDebut, dateFin);
        });

        const selected = this.selectedBoxId();
        const isSelected = selected ? String(selected) === String(boxId) : false;

        return {
          ...box,
          disponible: !overlap || isSelected
        };
      })
    );
  }

  private isOverlapping(aStart: Date, aEnd: Date | null, bStart: Date, bEnd: Date | null): boolean {
    const endA = aEnd ?? new Date('9999-12-31T23:59:59.999Z');
    const endB = bEnd ?? new Date('9999-12-31T23:59:59.999Z');
    return aStart <= endB && bStart <= endA;
  }

  protected selectBox(box: BoxCard): void {
    if (!box.disponible) return;
    this.selectedBoxId.set(box._id as string);
    this.recomputeAvailability();
  }

  protected viewLoyerHistory(box: BoxCard): void {
    this.router.navigate(['/boxs', box._id, 'loyers']);
  }

  protected formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(amount);
  }

  protected onSubmit(): void {
    if (!this.form.valid || !this.selectedBoxId()) {
      this.snackBar.open('Veuillez sélectionner un magasin, une période et un box disponible', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.form.markAllAsTouched();
      return;
    }

    const payload: any = {
      magasin: this.form.get('magasin')!.value,
      box: this.selectedBoxId(),
      dateDebut: this.form.get('dateDebut')!.value,
      dateFin: this.form.get('dateFin')!.value || null
    };

    this.isLoading.set(true);
    const req = this.isEditMode()
      ? this.service.update(this.associationId()!, payload)
      : this.service.create(payload);

    req.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open(
          this.isEditMode() ? 'Assignation modifiée' : 'Assignation créée',
          'Fermer',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          }
        );
        this.goBack();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open(error?.error?.message ?? 'Erreur lors de l\'enregistrement', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  protected onDelete(): void {
    if (!this.isEditMode() || !this.associationId()) return;
    if (!confirm('Voulez-vous vraiment supprimer cette assignation ?')) return;

    this.isLoading.set(true);
    this.service.delete(this.associationId()!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Assignation supprimée', 'Fermer', {
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

  protected onCancel(): void {
    this.goBack();
  }

  protected goBack(): void {
    this.router.navigate(['/box-magasins']);
  }
}
