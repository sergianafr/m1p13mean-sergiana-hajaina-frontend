import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VenteService, VenteItem } from '../../data-access/services/vente.service';

@Component({
  selector: 'app-traites',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './traites.component.html',
  styleUrl: './traites.component.scss'
})
export class TraitesComponent implements OnInit {
  private readonly venteService = inject(VenteService);
  private readonly router = inject(Router);

  readonly orders = signal<VenteItem[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.venteService.getTraites().subscribe({
      next: (data) => { this.orders.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  getPhoto(detail: any): string {
    return detail.produit?.photos?.length > 0
      ? detail.produit.photos[0].url
      : 'https://via.placeholder.com/80x80?text=No+photo';
  }

  goToDetail(produitId?: string | null): void {
    if (!produitId) return;
    this.router.navigate(['/shop/produit', produitId]);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalQte(order: VenteItem): number {
    return order.details?.reduce((sum, d) => sum + (d.qte || 0), 0) || 0;
  }
}
