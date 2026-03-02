import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTableComponent, ListHeaderComponent } from '../../../../../shared/components';
import { DynamicTableConfig } from '../../../../../shared/models';
import { MagasinService, Magasin } from '../../magasin.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../../core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-magasin-list',
  standalone: true,
  imports: [
    DynamicTableComponent,
    ListHeaderComponent,
    MatSnackBarModule
  ],
  templateUrl: './magasin-list.component.html',
  styleUrl: './magasin-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MagasinListComponent implements OnInit {
  private readonly magasinService = inject(MagasinService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  protected readonly magasins = signal<Magasin[]>([]);

  protected get canCreateMagasin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  protected get isBoutique(): boolean {
    return this.authService.hasRole('BOUTIQUE');
  }

  protected readonly tableConfig = signal<DynamicTableConfig>({
    columns: [
      {
        key: 'nomMagasin',
        label: 'Nom du Magasin',
        sortable: true,
        width: '25%'
      },
      {
        key: 'nif',
        label: 'NIF',
        sortable: true,
        width: '12%'
      },
      {
        key: 'stat',
        label: 'STAT',
        sortable: true,
        width: '12%'
      },
      {
        key: 'appUser',
        label: 'Propriétaire',
        sortable: true,
        width: '18%',
        format: (value: any) => {
          if (value && typeof value === 'object' && value.name && value.email) {
            return `${value.name} (${value.email})`;
          }
          return '-';
        }
      },
      {
        key: 'typeMagasin',
        label: 'Type de Magasin',
        sortable: true,
        width: '18%',
        format: (value: any) => value?.nomTypeMagasin || '-'
      },
      {
        key: 'dateAjout',
        label: 'Date d\'ajout',
        type: 'date',
        sortable: true,
        width: '15%'
      }
    ],
    clickable: true,
    rowRoute: '/magasins',
    idField: '_id',
    showActions: false,
    emptyMessage: 'Aucun magasin trouvé',
    loading: false,
    pageable: true,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.tableConfig.update(config => ({ ...config, loading: true }));

    const request$: Observable<Magasin[]> = this.isBoutique
      ? this.magasinService.getMine()
      : this.magasinService.getAll();

    request$.subscribe({
      next: (data) => {
        this.magasins.set(data);
        this.tableConfig.update(config => ({
          ...config,
          loading: false,
          totalItems: data.length
        }));
      },
      error: (error) => {
        this.tableConfig.update(config => ({ ...config, loading: false }));
        this.snackBar.open('Erreur lors du chargement', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  protected createNew(): void {
    this.router.navigate(['/magasins/nouveau']);
  }

  protected edit(row: Magasin): void {
    this.router.navigate(['/magasins', row._id]);
  }

  protected delete(row: Magasin): void {
    if (confirm(`Voulez-vous vraiment supprimer "${row.nomMagasin}" ?`)) {
      this.magasinService.delete(row._id!).subscribe({
        next: () => {
          this.snackBar.open('Magasin supprimé avec succès', 'Fermer', {
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
}