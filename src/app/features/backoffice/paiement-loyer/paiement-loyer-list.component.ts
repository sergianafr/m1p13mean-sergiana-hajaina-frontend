import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DynamicTableComponent, ListHeaderComponent } from '../../../shared/components';
import { DynamicTableConfig } from '../../../shared/models';
import { AuthService } from '../../../core/services/auth.service';
import { Magasin, MagasinService } from '../magasin/magasin.service';
import { PaiementLoyerEntity, PaiementLoyerFilters, PaiementLoyerService } from './paiement-loyer.service';

type PaymentTableRow = PaiementLoyerEntity & { periode: string; nbBoxes: number };

@Component({
  selector: 'app-paiement-loyer-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ListHeaderComponent,
    DynamicTableComponent,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './paiement-loyer-list.component.html',
  styleUrl: './paiement-loyer-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaiementLoyerListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly paiementService = inject(PaiementLoyerService);
  private readonly magasinService = inject(MagasinService);
  protected readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected readonly magasins = signal<Magasin[]>([]);
  protected readonly paiements = signal<PaymentTableRow[]>([]);

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

  protected readonly filtersForm = this.fb.nonNullable.group({
    magasin: [''],
    mois: [new Date().getMonth() + 1],
    annee: [this.currentYear]
  });

  protected readonly tableConfig = signal<DynamicTableConfig>({
    columns: [
      {
        key: 'magasin',
        label: 'Magasin',
        sortable: true,
        format: (value: unknown) => this.getMagasinName(value)
      },
      {
        key: 'periode',
        label: 'Période',
        sortable: true
      },
      {
        key: 'nbBoxes',
        label: 'Nombre de box',
        sortable: true
      },
      {
        key: 'montantPaye',
        label: 'Montant payé',
        sortable: true,
        format: (value: unknown) => this.formatCurrency(Number(value ?? 0))
      },
      {
        key: 'datePaiement',
        label: 'Date paiement',
        type: 'date',
        sortable: true
      }
    ],
    clickable: false,
    showActions: false,
    emptyMessage: 'Aucun paiement trouvé',
    loading: false,
    pageable: true,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadMagasinsAndPayments();
  }

  protected applyFilters(): void {
    this.loadPaiements();
  }

  protected resetFilters(): void {
    this.filtersForm.patchValue({
      magasin: this.authService.hasRole('BOUTIQUE') && this.magasins().length === 1 ? this.magasins()[0]._id ?? '' : '',
      mois: new Date().getMonth() + 1,
      annee: this.currentYear
    });
    this.loadPaiements();
  }

  protected createNew(): void {
    this.router.navigate(['/paiement-loyers/nouveau']);
  }

  private loadMagasinsAndPayments(): void {
    const magasinsRequest = this.authService.hasRole('ADMIN')
      ? this.magasinService.getAll().pipe(catchError(() => of([] as Magasin[])))
      : this.magasinService.getMine().pipe(catchError(() => of([] as Magasin[])));

    magasinsRequest.subscribe({
      next: (magasins) => {
        this.magasins.set(magasins);
        if (this.authService.hasRole('BOUTIQUE') && magasins.length === 1) {
          this.filtersForm.patchValue({ magasin: magasins[0]._id ?? '' }, { emitEvent: false });
        }
        this.loadPaiements();
      },
      error: () => {
        this.snackBar.open('Erreur lors du chargement des magasins', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private loadPaiements(): void {
    this.tableConfig.update(config => ({ ...config, loading: true }));

    const filters = this.buildFilters();

    if (this.authService.hasRole('ADMIN')) {
      this.paiementService.getPaiements({ ...filters, limit: 200 }).subscribe({
        next: (result) => this.onPaymentsLoaded(result.items),
        error: () => this.onLoadError()
      });
      return;
    }

    const selectedMagasin = this.filtersForm.getRawValue().magasin;
    if (selectedMagasin) {
      this.paiementService.getPaiementsByMagasin(selectedMagasin, { ...filters, limit: 200 }).subscribe({
        next: (result) => this.onPaymentsLoaded(result.items),
        error: () => this.onLoadError()
      });
      return;
    }

    const magasinIds = this.magasins().map(m => m._id).filter((value): value is string => Boolean(value));
    if (magasinIds.length === 0) {
      this.onPaymentsLoaded([]);
      return;
    }

    forkJoin(
      magasinIds.map(magasinId =>
        this.paiementService.getPaiementsByMagasin(magasinId, { ...filters, limit: 200 }).pipe(
          catchError(() => of({ items: [], pagination: { page: 1, limit: 200, total: 0, totalPages: 0 } }))
        )
      )
    ).subscribe({
      next: (results) => this.onPaymentsLoaded(results.flatMap(result => result.items)),
      error: () => this.onLoadError()
    });
  }

  private onPaymentsLoaded(items: PaiementLoyerEntity[]): void {
    const rows = this.toRows(items);
    this.paiements.set(rows);
    this.tableConfig.update(config => ({ ...config, loading: false, totalItems: rows.length }));
  }

  private onLoadError(): void {
    this.tableConfig.update(config => ({ ...config, loading: false }));
    this.snackBar.open('Erreur lors du chargement des paiements', 'Fermer', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  private buildFilters(): PaiementLoyerFilters {
    const formValue = this.filtersForm.getRawValue();
    const filters: PaiementLoyerFilters = {
      mois: Number(formValue.mois),
      annee: Number(formValue.annee)
    };

    if (formValue.magasin) {
      filters.magasin = formValue.magasin;
    }

    return filters;
  }

  private toRows(items: PaiementLoyerEntity[]): PaymentTableRow[] {
    return [...items]
      .map(item => ({
        ...item,
        periode: `${String(item.mois).padStart(2, '0')}/${item.annee}`,
        nbBoxes: Array.isArray(item.details) ? item.details.length : 0
      }))
      .sort((left, right) => new Date(String(right.datePaiement)).getTime() - new Date(String(left.datePaiement)).getTime());
  }

  private getMagasinName(value: unknown): string {
    if (!value) return '-';
    if (typeof value === 'string') {
      return this.magasins().find(magasin => magasin._id === value)?.nomMagasin ?? value;
    }

    const record = value as Record<string, unknown>;
    return typeof record['nomMagasin'] === 'string' ? String(record['nomMagasin']) : '-';
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(value);
  }
}
