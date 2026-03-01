import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
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
  readonly selectedTypeId = computed(() => this.searchService.selectedTypeId());
  readonly searchTerm = computed(() => this.searchService.searchTerm());

  readonly produits = computed(() => {
    let filtered = this.allProduits();
    
    // Filter by type
    const typeId = this.selectedTypeId();
    if (typeId) {
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
  }

  isTypeSelected(typeId: string | null): boolean {
    return this.selectedTypeId() === typeId;
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
}
