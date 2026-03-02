import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ProductService, ProduitFront } from '../../data-access/services/produit.service';
import { ProduitCardComponent } from '../../components/produit/produit.component';
import { PanierService } from '../../data-access/services/panier.service';
import { FavoriesService } from '../../data-access/services/favories.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SearchService } from '../../data-access/services/search.service';
import { TypeProduitService, TypeProduit } from '../../../backoffice/type-produit/type-produit.service';

type PriceSortOrder = 'asc' | 'desc' | null;
type RatingSortOrder = 'asc' | 'desc' | null;
const PROMO_FILTER_ID = '__PROMO__';

@Component({
  selector: 'app-shop-home',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule,
    ProduitCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class ShopHomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly panierService = inject(PanierService);
  private readonly favoriesService = inject(FavoriesService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly searchService = inject(SearchService);
  private readonly typeProduitService = inject(TypeProduitService);

  readonly allProduits = signal<ProduitFront[]>([]);
  readonly typesProduits = signal<TypeProduit[]>([]);
  readonly isLoading = signal(true);
  readonly priceSortOrder = signal<PriceSortOrder>(null);
  readonly ratingSortOrder = signal<RatingSortOrder>(null);
  readonly selectedTypeId = computed(() => this.searchService.selectedTypeId());
  readonly searchTerm = computed(() => this.searchService.searchTerm());
  readonly showPriceSort = computed(() => !!this.selectedTypeId());

  readonly produits = computed(() => {
    let filtered = this.allProduits();
    
    // Filter by type
    const typeId = this.selectedTypeId();
    if (typeId === PROMO_FILTER_ID) {
      filtered = filtered.filter(
        produit => (produit.prixPromo !== null && produit.prixPromo !== undefined) || !!produit.promotion
      );
    } else if (typeId) {
      filtered = filtered.filter(p => p.typeProduit?._id === typeId);
    }
    
    // Filter by search term
    const term = this.searchTerm();
    if (term && term.trim()) {
      const searchLower = term.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.nomProduit.toLowerCase().includes(searchLower)
      );
    }

    if (typeId && this.priceSortOrder()) {
      const direction = this.priceSortOrder();
      filtered = [...filtered].sort((first, second) => {
        const firstPrice = this.getEffectivePrice(first);
        const secondPrice = this.getEffectivePrice(second);

        if (direction === 'asc') {
          return firstPrice - secondPrice;
        }

        return secondPrice - firstPrice;
      });
    }

    if (typeId && this.ratingSortOrder()) {
      const direction = this.ratingSortOrder();
      filtered = [...filtered].sort((first, second) => {
        const firstRating = first.averageRating ?? 0;
        const secondRating = second.averageRating ?? 0;

        if (direction === 'asc') {
          return firstRating - secondRating;
        }

        return secondRating - firstRating;
      });
    }
    
    return filtered;
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadTypesProduits();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getAllProduitsWithRatings().subscribe({
      next: (data) => {
        this.allProduits.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement produits', err);
        this.isLoading.set(false);
      }
    });
  }

  loadTypesProduits(): void {
    this.typeProduitService.getAll().subscribe({
      next: (data) => {
        this.typesProduits.set(data);
      },
      error: (err) => {
        console.error('Erreur chargement types produits', err);
      }
    });
  }

  selectType(typeId: string | null): void {
    this.searchService.setSelectedType(typeId);

    if (!typeId) {
      this.priceSortOrder.set(null);
      this.ratingSortOrder.set(null);
    }
  }

  isTypeSelected(typeId: string | null): boolean {
    return this.selectedTypeId() === typeId;
  }

  selectPromo(): void {
    this.selectType(PROMO_FILTER_ID);
  }

  isPromoSelected(): boolean {
    return this.selectedTypeId() === PROMO_FILTER_ID;
  }

  selectPriceSort(order: PriceSortOrder): void {
    this.priceSortOrder.set(order);
    this.ratingSortOrder.set(null);
  }

  isPriceSortSelected(order: Exclude<PriceSortOrder, null>): boolean {
    return this.priceSortOrder() === order;
  }

  selectRatingSort(order: RatingSortOrder): void {
    this.ratingSortOrder.set(order);
    this.priceSortOrder.set(null);
  }

  isRatingSortSelected(order: Exclude<RatingSortOrder, null>): boolean {
    return this.ratingSortOrder() === order;
  }

  onAddToCart(produit: ProduitFront): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.panierService.addToCart(produit._id, user.id).subscribe({
      next: () => this.snackBar.open(`${produit.nomProduit} ajouté au panier`, 'OK', { duration: 2000 }),
      error: (err) => this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 })
    });
  }

  onAddToFavoris(produit: ProduitFront): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.favoriesService.addToFavoris(produit._id, user.id).subscribe({
      next: () => this.snackBar.open(`${produit.nomProduit} ajouté aux favoris`, 'OK', { duration: 2000 }),
      error: (err) => this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 })
    });
  }

  private getEffectivePrice(produit: ProduitFront): number {
    if (produit.prixPromo !== null && produit.prixPromo !== undefined) {
      return produit.prixPromo;
    }

    if (produit.prixActuel !== null && produit.prixActuel !== undefined) {
      return produit.prixActuel;
    }

    return Number.MAX_SAFE_INTEGER;
  }
}
