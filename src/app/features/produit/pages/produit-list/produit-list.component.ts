import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProduitService, Produit } from '../../produit.service';

@Component({
  selector: 'app-produit-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './produit-list.component.html',
  styleUrl: './produit-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProduitListComponent implements OnInit {
  private readonly produitService = inject(ProduitService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly produits = signal<Produit[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly displayedColumns = ['nomProduit', 'descriptionProduit', 'seuilNotification', 'photos', 'actions'];

  ngOnInit(): void {
    this.loadProduits();
  }

  private loadProduits(): void {
    this.isLoading.set(true);
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement des produits', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  protected onCreate(): void {
    this.router.navigate(['/produits/nouveau']);
  }

  protected onEdit(produit: Produit): void {
    this.router.navigate(['/produits', produit._id]);
  }

  protected onDelete(produit: Produit): void {
    if (confirm(`Voulez-vous vraiment supprimer "${produit.nomProduit}" ?`)) {
      this.isLoading.set(true);
      this.produitService.delete(produit._id!).subscribe({
        next: () => {
          this.snackBar.open('Produit supprimé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadProduits();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          console.error('Erreur:', error);
        }
      });
    }
  }

  protected getPhotoCount(produit: Produit): number {
    return produit.photos?.length || 0;
  }
}
