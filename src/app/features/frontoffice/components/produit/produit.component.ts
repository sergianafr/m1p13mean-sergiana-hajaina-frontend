import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { ProduitFront } from '../../data-access/services/produit.service';

@Component({
  selector: 'app-produit-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './produit.component.html',
  styleUrl: './produit.component.scss'
})
export class ProduitCardComponent {
  private readonly router = inject(Router);
  readonly produit = input.required<ProduitFront>();
  readonly addToCart = output<ProduitFront>();
  readonly addToFavoris = output<ProduitFront>();

  get photo(): string {
    const p = this.produit();
    return p.photos && p.photos.length > 0
      ? p.photos[0].url
      : 'https://via.placeholder.com/300x200?text=Pas+de+photo';
  }

  get ratingStars(): number[] {
    const p = this.produit();
    const rating = p.averageRating || 0;
    return Array(5).fill(0).map((_, i) => (i < Math.round(rating) ? 1 : 0));
  }

  goToDetail(): void {
    this.router.navigate(['/shop/produit', this.produit()._id]);
  }

  onAddToCart(): void {
    this.addToCart.emit(this.produit());
  }

  onAddToFavoris(): void {
    this.addToFavoris.emit(this.produit());
  }
}
