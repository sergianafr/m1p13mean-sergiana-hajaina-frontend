import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTableComponent, ListHeaderComponent } from '../../../../shared/components';
import { DynamicTableConfig } from '../../../../shared/models';
import { BoxService, Box } from '../../box.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-box-list',
  standalone: true,
  imports: [
    DynamicTableComponent,
    ListHeaderComponent,
    MatSnackBarModule
  ],
  templateUrl: './box-list.component.html',
  styleUrl: './box-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoxListComponent implements OnInit {
  private readonly boxService = inject(BoxService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly boxs = signal<Box[]>([]);

  protected readonly tableConfig = signal<DynamicTableConfig>({
    columns: [
      {
        key: 'nomBox',
        label: 'Nom du Box',
        sortable: true,
        width: '50%'
      },
      {
        key: 'aireBox',
        label: 'Aire (m²)',
        type: 'number',
        sortable: true,
        width: '20%'
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
    rowRoute: '/boxs',
    idField: '_id',
    showActions: false,
    emptyMessage: 'Aucun box trouvé',
    loading: false,
    pageable: true,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.tableConfig.update(config => ({ ...config, loading: true }));
    
    this.boxService.getAll().subscribe({
      next: (data) => {
        this.boxs.set(data);
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
    this.router.navigate(['/boxs/nouveau']);
  }

  protected edit(row: Box): void {
    this.router.navigate(['/boxs', row._id]);
  }

  protected delete(row: Box): void {
    if (confirm(`Voulez-vous vraiment supprimer "${row.nomBox}" ?`)) {
      this.boxService.delete(row._id!).subscribe({
        next: () => {
          this.snackBar.open('Box supprimé avec succès', 'Fermer', {
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
