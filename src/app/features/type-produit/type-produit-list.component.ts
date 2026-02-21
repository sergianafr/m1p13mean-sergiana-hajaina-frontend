import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTableComponent, ListHeaderComponent } from '../../shared/components';
import { DynamicTableConfig } from '../../shared/models';
import { TypeProduitService, TypeProduit } from './type-produit.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'type-produit-list',
  standalone: true,
  imports: [
    DynamicTableComponent,
    ListHeaderComponent,
    MatSnackBarModule
  ],
  template: `
    <div class="container mx-auto p-6">
      <list-header
        title="Types de Produits"
        actionLabel="Nouveau Type"
        (action)="createNew()">
      </list-header>

      <dynamic-table
        [config]="tableConfig()"
        [data]="typeProduits()">
      </dynamic-table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypeProduitListComponent implements OnInit {
  private readonly typeProduitService = inject(TypeProduitService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly typeProduits = signal<TypeProduit[]>([]);

  protected readonly tableConfig = signal<DynamicTableConfig>({
    columns: [
      {
        key: 'nomTypeProduit',
        label: 'Nom du Type',
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
    actions: [],
    clickable: true,
    rowRoute: '/type-produits',
    idField: '_id',
    showActions: true,
    emptyMessage: 'Aucun type de produit trouvé',
    loading: false,
    pageable: true,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.tableConfig.update(config => ({ ...config, loading: true }));
    
    this.typeProduitService.getAll().subscribe({
      next: (data) => {
        this.typeProduits.set(data);
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
    this.router.navigate(['/type-produits/nouveau']);
  }

  protected edit(row: TypeProduit): void {
    this.router.navigate(['/type-produits', row._id]);
  }

  protected delete(row: TypeProduit): void {
    if (confirm(`Voulez-vous vraiment supprimer "${row.nomTypeProduit}" ?`)) {
      this.typeProduitService.delete(row._id!).subscribe({
        next: () => {
          this.snackBar.open('Supprimé avec succès', 'Fermer', {
            duration: 3000,
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
