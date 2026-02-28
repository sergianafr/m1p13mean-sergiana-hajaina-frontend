import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../material/material.module';
import { Produit, ProduitService } from '../../../backoffice/produit/produit.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly produitService = inject(ProduitService);

  isLoading = true;
  errorMessage: string | null = null;
  produits: Produit[] = [];

  ngOnInit(): void {
    this.produitService.getAll().subscribe({
      next: (all) => {
        this.produits = this.pickRandom(all ?? [], 20);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger les produits';
      }
    });
  }

  getMainPhotoUrl(p: Produit): string | null {
    const url = p.photos?.[0]?.url;
    return url ? url : null;
  }

  getUniteLabel(p: Produit): string {
    const unite = p.unite;
    if (!unite) return '';
    if (typeof unite === 'string') return unite;
    return unite.nomUnite;
  }

  private pickRandom<T>(items: T[], count: number): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(count, copy.length));
  }
}
