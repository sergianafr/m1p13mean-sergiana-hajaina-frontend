import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService, ProduitFront, AvisProduit } from '../../data-access/services/produit.service';
import { PanierService } from '../../data-access/services/panier.service';
import { FavoriesService } from '../../data-access/services/favories.service';
import { AuthService } from '../../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-details-produit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
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
  private readonly fb = inject(FormBuilder);

  readonly produit = signal<ProduitFront | null>(null);
  readonly isLoading = signal(true);
  readonly selectedPhotoIndex = signal(0);
  readonly quantity = signal(1);
  readonly isFavorite = signal(false);
  readonly addingToCart = signal(false);

  // Avis
  readonly avis = signal<AvisProduit[]>([]);
  readonly isLoadingAvis = signal(false);
  readonly showReviewForm = signal(false);
  readonly isSubmitting = signal(false);
  readonly userReview = signal<AvisProduit | null>(null);
  readonly isEditMode = signal(false);
  readonly stars = [1, 2, 3, 4, 5];

  readonly reviewForm = this.fb.nonNullable.group({
    nombreEtoile: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    commentaire: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProductAndReviews(id);
    }
  }

  private loadProductAndReviews(id: string): void {
    this.isLoading.set(true);
    this.isLoadingAvis.set(true);

    forkJoin({
      produit: this.productService.getProduitByIdWithRating(id),
      avis: this.productService.getReviewsByProduitId(id)
    }).subscribe({
      next: ({ produit, avis }) => {
        this.produit.set(produit);
        this.avis.set(avis);
        this.checkUserReview();
        this.isLoading.set(false);
        this.isLoadingAvis.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.isLoadingAvis.set(false);
        this.router.navigate(['/shop']);
      }
    });
  }

  private checkUserReview(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const myReview = this.avis().find(a => a.appUser._id === user.id);
    this.userReview.set(myReview || null);
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

  toggleReviewForm(): void {
    this.showReviewForm.update(show => !show);
    if (this.showReviewForm()) {
      const review = this.userReview();
      if (review) {
        this.isEditMode.set(true);
        this.reviewForm.patchValue({
          nombreEtoile: review.nombreEtoile,
          commentaire: review.commentaire || ''
        });
      } else {
        this.isEditMode.set(false);
        this.reviewForm.reset({ nombreEtoile: 0, commentaire: '' });
      }
    }
  }

  setRating(value: number): void {
    this.reviewForm.patchValue({ nombreEtoile: value });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) return;

    const produit = this.produit();
    if (!produit) return;

    this.isSubmitting.set(true);

    const dto = {
      ...this.reviewForm.getRawValue(),
      produit: produit._id
    };

    console.log(dto);

    const operation = this.isEditMode() && this.userReview()
      ? this.productService.updateReview(this.userReview()!._id, dto)
      : this.productService.addReview(dto);

    operation.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode() ? 'Avis modifié avec succès' : 'Avis ajouté avec succès',
          'OK',
          { duration: 2500 }
        );
        this.showReviewForm.set(false);
        this.reviewForm.reset({ nombreEtoile: 0, commentaire: '' });
        this.isSubmitting.set(false);
        this.loadProductAndReviews(produit._id);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de l\'envoi de l\'avis', 'Fermer', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  deleteReview(avisId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;

    this.productService.deleteReview(avisId).subscribe({
      next: () => {
        this.snackBar.open('Avis supprimé', 'OK', { duration: 2000 });
        const produit = this.produit();
        if (produit) {
          this.loadProductAndReviews(produit._id);
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de la suppression', 'Fermer', { duration: 3000 });
      }
    });
  }

  isMyReview(review: AvisProduit): boolean {
    const user = this.authService.getCurrentUser();
    return user ? review.appUser._id === user.id : false;
  }

  getReviewAuthorName(review: AvisProduit): string {
    return this.isMyReview(review) ? 'Votre avis' : review.appUser.name;
  }

  getRatingStarsForReview(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => (i < rating ? 1 : 0));
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get ratingStars(): number[] {
    const p = this.produit();
    const rating = p?.averageRating || 0;
    return Array(5).fill(0).map((_, i) => (i < Math.round(rating) ? 1 : 0));
  }
}
