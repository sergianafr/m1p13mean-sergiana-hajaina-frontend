import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { MagasinFront } from '../../data-access/services/magasin.service';

@Component({
  selector: 'app-magasin-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './magasin-card.component.html',
  styleUrl: './magasin-card.component.scss'
})
export class MagasinCardComponent {
  private readonly router = inject(Router);
  readonly magasin = input.required<MagasinFront>();

  get ratingStars(): number[] {
    const rating = this.magasin().averageRating || 0;
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  goToDetail(): void {
    this.router.navigate(['/shop/magasin', this.magasin()._id]);
  }
}
