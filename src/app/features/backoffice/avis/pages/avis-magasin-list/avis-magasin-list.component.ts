import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DynamicTableComponent, ListHeaderComponent } from '../../../../../shared/components';
import { DynamicTableConfig } from '../../../../../shared/models';
import { AuthService } from '../../../../../core/services/auth.service';
import { Magasin, MagasinService } from '../../../magasin/magasin.service';
import { AvisBackofficeService, AvisMagasinBackoffice } from '../../avis-backoffice.service';

@Component({
  selector: 'app-avis-magasin-list',
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
  templateUrl: './avis-magasin-list.component.html',
  styleUrl: './avis-magasin-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvisMagasinListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly magasinService = inject(MagasinService);
  private readonly avisBackofficeService = inject(AvisBackofficeService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly magasins = signal<Magasin[]>([]);
  protected readonly allAvis = signal<AvisMagasinBackoffice[]>([]);
  protected readonly filteredAvis = signal<AvisMagasinBackoffice[]>([]);
  protected readonly isLoading = signal(false);

  protected readonly filtersForm = this.fb.nonNullable.group({
    magasinId: ['ALL']
  });

  protected readonly tableConfig = computed<DynamicTableConfig>(() => ({
    columns: [
      {
        key: 'magasinInfo',
        label: 'Magasin',
        sortable: true,
        format: value => {
          const magasin = value as { nomMagasin?: string } | null;
          return magasin?.nomMagasin || '-';
        }
      },
      {
        key: 'nombreEtoile',
        label: 'Note',
        sortable: true,
        align: 'center',
        format: value => this.formatStars(Number(value ?? 0))
      },
      {
        key: 'commentaire',
        label: 'Commentaire',
        format: value => String(value ?? '-').trim() || '-'
      },
      {
        key: 'appUser',
        label: 'Auteur',
        sortable: true,
        format: value => {
          const user = value as { name?: string; email?: string } | null;
          if (!user) {
            return '-';
          }

          if (user.name && user.email) {
            return `${user.name} (${user.email})`;
          }

          return user.name || user.email || '-';
        }
      },
      {
        key: 'dateAjout',
        label: 'Date',
        type: 'date',
        sortable: true
      }
    ],
    clickable: false,
    showActions: false,
    loading: this.isLoading(),
    emptyMessage: 'Aucun avis magasin trouvé',
    pageable: true,
    pageSize: 10,
    totalItems: this.filteredAvis().length
  }));

  ngOnInit(): void {
    this.loadData();
  }

  protected applyFilters(): void {
    const magasinId = this.filtersForm.getRawValue().magasinId;

    if (magasinId === 'ALL') {
      this.filteredAvis.set(this.allAvis());
      return;
    }

    this.filteredAvis.set(
      this.allAvis().filter(avis => avis.magasinInfo?._id === magasinId)
    );
  }

  protected resetFilters(): void {
    this.filtersForm.patchValue({ magasinId: 'ALL' });
    this.filteredAvis.set(this.allAvis());
  }

  private loadData(): void {
    this.isLoading.set(true);

    const magasinRequest = this.authService.hasRole('ADMIN')
      ? this.magasinService.getAll()
      : this.magasinService.getMine();

    magasinRequest.subscribe({
      next: magasins => {
        this.magasins.set(magasins);

        this.avisBackofficeService.getAvisMagasinsByMagasins(magasins).subscribe({
          next: avis => {
            this.allAvis.set(avis);
            this.filteredAvis.set(avis);
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
            this.snackBar.open('Erreur lors du chargement des avis magasins', 'Fermer', {
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

  private formatStars(value: number): string {
    const rating = Math.max(0, Math.min(5, Math.round(value)));
    return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
  }
}
