import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTableComponent, ListHeaderComponent } from '../../../../shared/components';
import { DynamicTableConfig } from '../../../../shared/models';
import { UserService, User } from '../../user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    DynamicTableComponent,
    ListHeaderComponent,
    MatSnackBarModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly users = signal<User[]>([]);

  protected readonly tableConfig = signal<DynamicTableConfig>({
    columns: [
      {
        key: 'name',
        label: 'Nom',
        sortable: true,
        width: '30%'
      },
      {
        key: 'email',
        label: 'Email',
        sortable: true,
        width: '35%'
      },
      {
        key: 'role',
        label: 'Rôle',
        sortable: true,
        width: '20%',
        format: (value: unknown) => {
          const roleLabels: Record<string, string> = {
            'CLIENT': 'Client',
            'BOUTIQUE': 'Boutique',
            'ADMIN': 'Administrateur'
          };
          return roleLabels[value as string] || (value as string);
        }
      },
      {
        key: 'createdAt',
        label: 'Date de création',
        type: 'date',
        sortable: true,
        width: '15%'
      }
    ],
    clickable: true,
    rowRoute: '/users',
    idField: '_id',
    showActions: false,
    emptyMessage: 'Aucun utilisateur trouvé',
    loading: false,
    pageable: true,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.tableConfig.update(config => ({ ...config, loading: true }));
    
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
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
    this.router.navigate(['/users/nouveau']);
  }

  protected edit(row: User): void {
    this.router.navigate(['/users', row._id]);
  }

  protected delete(row: User): void {
    if (confirm(`Voulez-vous vraiment supprimer "${row.name}" ?`)) {
      this.userService.delete(row._id!).subscribe({
        next: () => {
          this.snackBar.open('Utilisateur supprimé avec succès', 'Fermer', {
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
