import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PanierService, PanierItem } from '../../data-access/services/panier.service';
import { VenteService } from '../../data-access/services/vente.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  private readonly venteService = inject(VenteService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly items = signal<PanierItem[]>([]);
  readonly isLoading = signal(true);
  readonly isCheckingOut = signal(false);

  readonly totalItems = computed(() =>
    this.items().reduce((sum, item) => sum + (item.qte || 1), 0)
  );

  readonly totalPrix = computed(() =>
    this.items().reduce((sum, item) => sum + ((item.produit?.prixActuel ?? 0) * (item.qte || 1)), 0)
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

  changeQte(item: PanierItem, delta: number): void {
    const newQte = Math.max(1, (item.qte || 1) + delta);
    this.updateItemQte(item, newQte);
  }

  onQteInput(item: PanierItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = parseInt(input.value, 10);
    if (isNaN(value) || value < 1) value = 1;
    input.value = String(value);
    this.updateItemQte(item, value);
  }

  private updateItemQte(item: PanierItem, newQte: number): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Optimistic UI update
    this.items.update(list =>
      list.map(i => i._id === item._id ? { ...i, qte: newQte } : i)
    );

    this.panierService.updateCartQuantity(item.produit._id, user.id, newQte).subscribe({
      error: (err) => {
        // Revert on error
        this.items.update(list =>
          list.map(i => i._id === item._id ? { ...i, qte: item.qte } : i)
        );
        this.snackBar.open(err.error?.message || 'Erreur de mise \u00e0 jour', 'Fermer', { duration: 3000 });
      }
    });
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

  checkout(): void {
    const user = this.authService.getCurrentUser();
    if (!user || this.items().length === 0) return;

    this.isCheckingOut.set(true);
    const details = this.items().map(item => ({
      produit: item.produit._id,
      qte: item.qte || 1
    }));

    this.venteService.checkout(details).subscribe({
      next: () => {
        // Clear cart after successful purchase
        this.panierService.clearCart(user.id).subscribe();
        this.snackBar.open('Commande valid\u00e9e avec succ\u00e8s !', 'Voir', {
          duration: 4000
        }).onAction().subscribe(() => {
          this.router.navigate(['/shop/traites']);
        });
        this.items.set([]);
        this.isCheckingOut.set(false);
      },
      error: (err) => {
        this.isCheckingOut.set(false);
        this.snackBar.open(err.error?.message || 'Erreur lors de la commande', 'Fermer', { duration: 4000 });
      }
    });
  }
}
