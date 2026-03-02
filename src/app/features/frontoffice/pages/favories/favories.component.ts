import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FavoriesService, FavoriItem } from '../../data-access/services/favories.service';
import { PanierService } from '../../data-access/services/panier.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-favories',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './favories.component.html',
  styleUrl: './favories.component.scss'
})
export class FavoriesComponent implements OnInit {
  private readonly favoriesService = inject(FavoriesService);
  private readonly panierService = inject(PanierService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly favoris = signal<FavoriItem[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadFavoris();
  }

  loadFavoris(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.isLoading.set(true);
    this.favoriesService.getFavorisByUser(user.id).subscribe({
      next: (data) => { this.favoris.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  getPhoto(item: FavoriItem): string {
    return item.produit?.photos?.length > 0
      ? item.produit.photos[0].url
      : 'https://via.placeholder.com/120x120?text=No+photo';
  }

  goToDetail(produitId: string): void {
    this.router.navigate(['/shop/produit', produitId]);
  }

  addToCart(item: FavoriItem): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.panierService.addToCart(item.produit._id, user.id).subscribe({
      next: () => this.snackBar.open(`${item.produit.nomProduit} ajouté au panier`, 'OK', { duration: 2000 }),
      error: (err) => this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 })
    });
  }

  removeFavori(item: FavoriItem): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.favoriesService.removeFromFavoris(item.produit._id, user.id).subscribe({
      next: () => {
        this.favoris.update(list => list.filter(f => f._id !== item._id));
        this.snackBar.open('Retiré des favoris', 'OK', { duration: 2000 });
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 })
    });
  }
}
