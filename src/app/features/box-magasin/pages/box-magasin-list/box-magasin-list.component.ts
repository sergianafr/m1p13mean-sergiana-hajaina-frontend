import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { DynamicTableComponent, ListHeaderComponent } from '../../../../shared/components';
import { DynamicTableConfig } from '../../../../shared/models';
import { BoxMagasinService, MagasinBox } from '../../box-magasin.service';
import { LoyerBoxService, LoyerBox } from '../../../loyer-box/loyer-box.service';

@Component({
  selector: 'app-box-magasin-list',
  standalone: true,
  imports: [DynamicTableComponent, ListHeaderComponent, MatSnackBarModule],
  templateUrl: './box-magasin-list.component.html',
  styleUrl: './box-magasin-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoxMagasinListComponent implements OnInit {
  private readonly service = inject(BoxMagasinService);
  private readonly loyerBoxService = inject(LoyerBoxService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly rows = signal<(MagasinBox & { loyerActuel?: LoyerBox | null })[]>([]);

  protected readonly tableConfig = signal<DynamicTableConfig>({
    columns: [
      {
        key: 'magasin',
        label: 'Magasin',
        sortable: true,
        width: '25%',
        format: (value: unknown) => {
          const v = value as any;
          return v?.nomMagasin ?? '-';
        }
      },
      {
        key: 'box',
        label: 'Box',
        sortable: true,
        width: '15%',
        format: (value: unknown) => {
          const v = value as any;
          return v?.nomBox ?? '-';
        }
      },
      {
        key: 'dateDebut',
        label: 'Début',
        type: 'date',
        sortable: true,
        width: '12%'
      },
      {
        key: 'dateFin',
        label: 'Fin',
        type: 'date',
        sortable: true,
        width: '12%'
      },
      {
        key: 'loyerActuel',
        label: 'Loyer actuel',
        sortable: false,
        width: '16%',
        format: (value: unknown) => {
          const l = value as any;
          if (!l?.montantLoyer) return '-';
          return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(l.montantLoyer);
        }
      }
    ],
    clickable: true,
    rowRoute: '/box-magasins',
    idField: '_id',
    showActions: true,
    actions: [
      {
        label: 'Historique loyers',
        icon: 'history',
        handler: (row: unknown) => {
          const r = row as any;
          const boxId = r?.box?._id ?? r?.box;
          if (boxId) {
            this.router.navigate(['/boxs', boxId, 'loyers']);
          }
        }
      },
      {
        label: 'Supprimer',
        icon: 'delete',
        color: 'warn',
        handler: (row: unknown) => this.deleteRow(row as any)
      }
    ],
    emptyMessage: 'Aucune assignation trouvée',
    loading: false,
    pageable: true,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadData();
  }

  protected createNew(): void {
    this.router.navigate(['/box-magasins/nouveau']);
  }

  private loadData(): void {
    this.tableConfig.update(c => ({ ...c, loading: true }));

    this.service.getAll().pipe(
      map((associations) => associations ?? [])
    ).subscribe({
      next: (associations) => {
        if (associations.length === 0) {
          this.rows.set([]);
          this.tableConfig.update(c => ({ ...c, loading: false, totalItems: 0 }));
          return;
        }

        const loyerRequests = associations.map(a => {
          const boxId = (a as any)?.box?._id ?? (a as any)?.box;
          if (!boxId) return of(null);
          return this.loyerBoxService.getCurrentByBox(boxId).pipe(catchError(() => of(null)));
        });

        forkJoin(loyerRequests).subscribe({
          next: (loyers) => {
            const merged = associations.map((a, idx) => ({
              ...a,
              loyerActuel: loyers[idx]
            }));
            this.rows.set(merged);
            this.tableConfig.update(c => ({
              ...c,
              loading: false,
              totalItems: merged.length
            }));
          },
          error: () => {
            // Even if loyer loading fails, show associations
            this.rows.set(associations);
            this.tableConfig.update(c => ({
              ...c,
              loading: false,
              totalItems: associations.length
            }));
          }
        });
      },
      error: (error) => {
        this.tableConfig.update(c => ({ ...c, loading: false }));
        this.snackBar.open('Erreur lors du chargement', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  private deleteRow(row: MagasinBox): void {
    const mag = (row as any)?.magasin?.nomMagasin ?? 'cet élément';
    const box = (row as any)?.box?.nomBox ?? '';
    const label = box ? `${mag} - ${box}` : mag;
    if (!confirm(`Voulez-vous vraiment supprimer "${label}" ?`)) return;

    this.service.delete(row._id!).subscribe({
      next: () => {
        this.snackBar.open('Assignation supprimée', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadData();
      },
      error: (error) => {
        this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }
}
