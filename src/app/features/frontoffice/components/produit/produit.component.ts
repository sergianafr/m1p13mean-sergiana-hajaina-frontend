import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ProduitFront } from '../../data-access/services/produit.service';

@Component({
  selector: 'app-produit-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './produit.component.html',
  styleUrl: './produit.component.scss'
})
export class ProduitCardComponent {
  readonly produit = input.required<ProduitFront>();
  readonly addToCart = output<ProduitFront>();
  readonly addToFavoris = output<ProduitFront>();

  get photo(): string {
    const p = this.produit();
    return p.photos && p.photos.length > 0
      ? p.photos[0].url
      : 'https://via.placeholder.com/300x200?text=Pas+de+photo';
  }

  onAddToCart(): void {
    this.addToCart.emit(this.produit());
  }

  onAddToFavoris(): void {
    this.addToFavoris.emit(this.produit());
  }
}
