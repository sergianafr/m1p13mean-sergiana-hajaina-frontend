import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTableComponent, ListHeaderComponent } from '../../../../shared/components';
import { DynamicTableConfig } from '../../../../shared/models';
import { TypeMagasinService, TypeMagasin } from '../../type-magasin.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-type-magasin-list',
  standalone: true,
  imports: [
    DynamicTableComponent,
    ListHeaderComponent,
    MatSnackBarModule
  ],
  templateUrl: './type-magasin-list.component.html',
  styleUrl: './type-magasin-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypeMagasinListComponent implements OnInit {
  private readonly typeMagasinService = inject(TypeMagasinService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly typeMagasins = signal<TypeMagasin[]>([]);

  protected readonly tableConfig = signal<DynamicTableConfig>({
    columns: [
      {
        key: 'nomTypeMagasin',
        label: 'Nom du Type de Magasin',
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
    rowRoute: '/type-magasins',
    idField: '_id',
    showActions: false,
    emptyMessage: 'Aucun type de magasin trouvé',
    loading: false,
    pageable: true,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.tableConfig.update(config => ({ ...config, loading: true }));
    
    this.typeMagasinService.getAll().subscribe({
      next: (data) => {
        this.typeMagasins.set(data);
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
    this.router.navigate(['/type-magasins/nouveau']);
  }

  protected edit(row: TypeMagasin): void {
    this.router.navigate(['/type-magasins', row._id]);
  }

  protected delete(row: TypeMagasin): void {
    if (confirm(`Voulez-vous vraiment supprimer "${row.nomTypeMagasin}" ?`)) {
      this.typeMagasinService.delete(row._id!).subscribe({
        next: () => {
          this.snackBar.open('Type de magasin supprimé avec succès', 'Fermer', {
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
