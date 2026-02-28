import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService, ProduitFront } from '../../data-access/services/produit.service';
import { PanierService } from '../../data-access/services/panier.service';
import { FavoriesService } from '../../data-access/services/favories.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-details-produit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './details-produit.component.html',
  styleUrl: './details-produit.component.scss'
})
export class DetailsProduitComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly panierService = inject(PanierService);
  private readonly favoriesService = inject(FavoriesService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly produit = signal<ProduitFront | null>(null);
  readonly isLoading = signal(true);
  readonly selectedPhotoIndex = signal(0);
  readonly quantity = signal(1);
  readonly isFavorite = signal(false);
  readonly addingToCart = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  private loadProduct(id: string): void {
    this.isLoading.set(true);
    this.productService.getProduitById(id).subscribe({
      next: (data) => {
        this.produit.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/shop']);
      }
    });
  }

  get mainPhoto(): string {
    const p = this.produit();
    if (!p || !p.photos || p.photos.length === 0) {
      return 'https://via.placeholder.com/600x400?text=Pas+de+photo';
    }
    return p.photos[this.selectedPhotoIndex()].url;
  }

  selectPhoto(index: number): void {
    this.selectedPhotoIndex.set(index);
  }

  incrementQty(): void {
    this.quantity.update(q => q + 1);
  }

  decrementQty(): void {
    this.quantity.update(q => (q > 1 ? q - 1 : 1));
  }

  addToCart(): void {
    const p = this.produit();
    const user = this.authService.getCurrentUser();
    if (!p || !user) return;

    this.addingToCart.set(true);
    this.panierService.addToCart(p._id, user.id, this.quantity()).subscribe({
      next: () => {
        this.snackBar.open(`${p.nomProduit} ajouté au panier (x${this.quantity()})`, 'OK', { duration: 2500 });
        this.addingToCart.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de l\'ajout au panier', 'Fermer', { duration: 3000 });
        this.addingToCart.set(false);
      }
    });
  }

  toggleFavorite(): void {
    const p = this.produit();
    const user = this.authService.getCurrentUser();
    if (!p || !user) return;

    if (this.isFavorite()) {
      this.favoriesService.removeFromFavoris(p._id, user.id).subscribe({
        next: () => {
          this.isFavorite.set(false);
          this.snackBar.open('Retiré des favoris', 'OK', { duration: 2000 });
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 })
      });
    } else {
      this.favoriesService.addToFavoris(p._id, user.id).subscribe({
        next: () => {
          this.isFavorite.set(true);
          this.snackBar.open('Ajouté aux favoris', 'OK', { duration: 2000 });
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 })
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/shop']);
  }
}
