import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService, ProduitFront } from '../../data-access/services/produit.service';
import { ProduitCardComponent } from '../../components/produit/produit.component';

@Component({
  selector: 'app-shop-home',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    ProduitCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class ShopHomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);

  readonly produits = signal<ProduitFront[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getRandomProduits(20).subscribe({
      next: (data) => {
        this.produits.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement produits', err);
        this.isLoading.set(false);
      }
    });
  }

  onAddToCart(produit: ProduitFront): void {
    this.snackBar.open(`${produit.nomProduit} ajout\u00e9 au panier`, 'OK', { duration: 2000 });
  }

  onAddToFavoris(produit: ProduitFront): void {
    this.snackBar.open(`${produit.nomProduit} ajout\u00e9 aux favoris`, 'OK', { duration: 2000 });
  }
}
