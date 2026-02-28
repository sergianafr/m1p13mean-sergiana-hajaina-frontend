import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PanierService, PanierItem } from '../../data-access/services/panier.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './panier.component.html',
  styleUrl: './panier.component.scss'
})
export class PanierComponent implements OnInit {
  private readonly panierService = inject(PanierService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly items = signal<PanierItem[]>([]);
  readonly isLoading = signal(true);

  readonly totalItems = computed(() =>
    this.items().reduce((sum, item) => sum + (item.qte || 1), 0)
  );

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.isLoading.set(true);
    this.panierService.getCartByUser(user.id).subscribe({
      next: (data) => { this.items.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  getPhoto(item: PanierItem): string {
    return item.produit?.photos?.length > 0
      ? item.produit.photos[0].url
      : 'https://via.placeholder.com/120x120?text=No+photo';
  }

  goToDetail(produitId: string): void {
    this.router.navigate(['/shop/produit', produitId]);
  }

  removeItem(item: PanierItem): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.panierService.removeFromCart(item.produit._id, user.id).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i._id !== item._id));
        this.snackBar.open('Produit retir\u00e9 du panier', 'OK', { duration: 2000 });
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 })
    });
  }
}
