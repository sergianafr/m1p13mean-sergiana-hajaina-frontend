import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DynamicTableComponent, ListHeaderComponent } from '../../../shared/components';
import { DynamicTableConfig } from '../../../shared/models';
import { Magasin, MagasinService } from '../magasin/magasin.service';
import { PaiementLoyerEntity, PaiementLoyerService } from './paiement-loyer.service';

type StatusRow = {
  magasinId: string;
  nomMagasin: string;
  statut: string;
  montantPaye: number;
  datePaiement?: Date | string;
  nbBoxes: number;
};

@Component({
  selector: 'app-paiement-loyer-admin-status',
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
  templateUrl: './paiement-loyer-admin-status.component.html',
  styleUrl: './paiement-loyer-admin-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaiementLoyerAdminStatusComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly magasinService = inject(MagasinService);
  private readonly paiementService = inject(PaiementLoyerService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly magasins = signal<Magasin[]>([]);
  protected readonly rows = signal<StatusRow[]>([]);

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
    mois: [new Date().getMonth() + 1],
    annee: [this.currentYear]
  });

  protected readonly tableConfig = signal<DynamicTableConfig>({
    columns: [
      { key: 'nomMagasin', label: 'Magasin', sortable: true },
      {
        key: 'statut',
        label: 'Statut',
        sortable: true,
        format: (value: unknown) => {
          const status = String(value ?? '');
          return status === 'Payé' ? '● Payé' : '● Non payé';
        },
        cellClass: (row: unknown) => {
          const current = row as StatusRow;
          return current.statut === 'Payé' ? 'status-paid' : 'status-unpaid';
        }
      },
      {
        key: 'montantPaye',
        label: 'Montant payé',
        sortable: true,
        format: (value: unknown) => Number(value) > 0 ? this.formatCurrency(Number(value)) : '-'
      },
      {
        key: 'datePaiement',
        label: 'Date paiement',
        type: 'date',
        sortable: true,
        format: (value: unknown) => value ? new Date(String(value)).toLocaleDateString('fr-FR') : '-'
      },
      {
        key: 'nbBoxes',
        label: 'Box payés',
        sortable: true,
        format: (value: unknown) => Number(value) > 0 ? String(value) : '-'
      }
    ],
    clickable: false,
    showActions: false,
    emptyMessage: 'Aucun magasin trouvé',
    loading: false,
    pageable: true,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadData();
  }

  protected applyFilters(): void {
    this.loadData();
  }

  protected resetFilters(): void {
    this.filtersForm.patchValue({
      mois: new Date().getMonth() + 1,
      annee: this.currentYear
    });
    this.loadData();
  }

  private loadData(): void {
    this.tableConfig.update(config => ({ ...config, loading: true }));

    const mois = Number(this.filtersForm.getRawValue().mois);
    const annee = Number(this.filtersForm.getRawValue().annee);

    this.magasinService.getAll().subscribe({
      next: (magasins) => {
        this.magasins.set(magasins);

        this.paiementService.getPaiements({ mois, annee, limit: 500 }).subscribe({
          next: (result) => {
            const rows = this.buildStatusRows(magasins, result.items);
            this.rows.set(rows);
            this.tableConfig.update(config => ({ ...config, loading: false, totalItems: rows.length }));
          },
          error: () => {
            this.tableConfig.update(config => ({ ...config, loading: false }));
            this.snackBar.open('Erreur lors du chargement des paiements', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      },
      error: () => {
        this.tableConfig.update(config => ({ ...config, loading: false }));
        this.snackBar.open('Erreur lors du chargement des magasins', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private buildStatusRows(magasins: Magasin[], paiements: PaiementLoyerEntity[]): StatusRow[] {
    const paymentsByMagasin = new Map<string, PaiementLoyerEntity>();

    paiements.forEach(paiement => {
      const magasinId = this.extractId(paiement.magasin);
      if (magasinId) {
        paymentsByMagasin.set(magasinId, paiement);
      }
    });

    return magasins
      .map(magasin => {
        const id = String(magasin._id ?? '');
        const paiement = paymentsByMagasin.get(id);

        return {
          magasinId: id,
          nomMagasin: magasin.nomMagasin,
          statut: paiement ? 'Payé' : 'Non payé',
          montantPaye: paiement ? Number(paiement.montantPaye) : 0,
          datePaiement: paiement?.datePaiement,
          nbBoxes: paiement?.details?.length ?? 0
        };
      })
      .sort((left, right) => left.nomMagasin.localeCompare(right.nomMagasin, 'fr'));
  }

  private extractId(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;

    const record = value as Record<string, unknown>;
    const id = record['_id'];
    return typeof id === 'string' ? id : '';
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(value);
  }
}
