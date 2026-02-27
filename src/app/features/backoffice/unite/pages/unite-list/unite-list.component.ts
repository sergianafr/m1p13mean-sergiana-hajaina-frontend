import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTableComponent, ListHeaderComponent } from '../../../../../shared/components';
import { DynamicTableConfig } from '../../../../../shared/models';
import { UniteService, Unite } from '../../unite.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-unite-list',
  standalone: true,
  imports: [
    DynamicTableComponent,
    ListHeaderComponent,
    MatSnackBarModule
  ],
  templateUrl: './unite-list.component.html',
  styleUrl: './unite-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UniteListComponent implements OnInit {
  private readonly uniteService = inject(UniteService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly unites = signal<Unite[]>([]);

  protected readonly tableConfig = signal<DynamicTableConfig>({
    columns: [
      {
        key: 'nomUnite',
        label: 'Nom de l\'Unité',
        sortable: true,
        width: '70%'
      },
      {
        key: 'createdAt',
        label: 'Date de création',
        type: 'date',
        sortable: true,
        width: '30%'
      }
    ],
    clickable: true,
    rowRoute: '/unites',
    idField: '_id',
    showActions: false,
    emptyMessage: 'Aucune unité trouvée',
    loading: false,
    pageable: true,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.tableConfig.update(config => ({ ...config, loading: true }));
    
    this.uniteService.getAll().subscribe({
      next: (data) => {
        this.unites.set(data);
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
    this.router.navigate(['/unites/nouveau']);
  }

  protected edit(row: Unite): void {
    this.router.navigate(['/unites', row._id]);
  }

  protected delete(row: Unite): void {
    if (confirm(`Voulez-vous vraiment supprimer "${row.nomUnite}" ?`)) {
      this.uniteService.delete(row._id!).subscribe({
        next: () => {
          this.snackBar.open('Unité supprimée avec succès', 'Fermer', {
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
