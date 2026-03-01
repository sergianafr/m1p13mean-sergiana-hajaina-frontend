import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MagasinService, MagasinFront, AvisMagasin } from '../../data-access/services/magasin.service';
import { ProduitFront, ProductService } from '../../data-access/services/produit.service';
import { ProduitCardComponent } from '../../components/produit/produit.component';
import { PanierService } from '../../data-access/services/panier.service';
import { FavoriesService } from '../../data-access/services/favories.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FoGobackButtonComponent } from '../../../../shared/components/fo-goback-button/fo-goback-button.component';

@Component({
  selector: 'app-magasin-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    ProduitCardComponent,
    FoGobackButtonComponent
  ],
  templateUrl: './magasin-detail.component.html',
  styleUrl: './magasin-detail.component.scss'
})
export class MagasinDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly magasinService = inject(MagasinService);
  private readonly panierService = inject(PanierService);
  private readonly favoriesService = inject(FavoriesService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  readonly magasin = signal<MagasinFront | null>(null);
  readonly produits = signal<ProduitFront[]>([]);
  readonly avis = signal<AvisMagasin[]>([]);
  readonly userReview = signal<AvisMagasin | null>(null);
  readonly isLoading = signal(true);
  readonly isLoadingProduits = signal(true);
  readonly isLoadingAvis = signal(true);
  readonly showReviewForm = signal(false);
  readonly isSubmitting = signal(false);
  readonly isEditMode = signal(false);

  readonly reviewForm = this.fb.group({
    nombreEtoile: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    commentaire: ['']
  });

  readonly stars = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMagasin(id);
      this.loadProduits(id);
      this.loadAvis(id);
    }
  }

  loadMagasin(id: string): void {
    this.isLoading.set(true);
    this.magasinService.getMagasinByIdWithRating(id).subscribe({
      next: (data) => {
        this.magasin.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement magasin', err);
        this.snackBar.open('Erreur lors du chargement du magasin', 'Fermer', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  loadProduits(id: string): void {
    this.isLoadingProduits.set(true);
    this.magasinService.getProductsByMagasinId(id).subscribe({
      next: (data) => {
        this.produits.set(data);
        this.isLoadingProduits.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement produits', err);
        this.isLoadingProduits.set(false);
      }
    });
  }

  loadAvis(id: string): void {
    this.isLoadingAvis.set(true);
    const currentUser = this.authService.getCurrentUser();
    
    this.magasinService.getReviewsByMagasinId(id).subscribe({
      next: (data) => {
        this.avis.set(data);
        
        if (currentUser) {
          const myReview = data.find(avis => avis.appUser._id === currentUser.id);
          this.userReview.set(myReview || null);
        }
        
        this.isLoadingAvis.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement avis', err);
        this.isLoadingAvis.set(false);
      }
    });
  }

  get ratingStars(): number[] {
    const rating = this.magasin()?.averageRating || 0;
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  getRatingStarsForReview(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  toggleReviewForm(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.snackBar.open('Vous devez être connecté pour laisser un avis', 'Fermer', { duration: 3000 });
      return;
    }

    const existingReview = this.userReview();
    if (existingReview) {
      this.isEditMode.set(true);
      this.reviewForm.patchValue({
        nombreEtoile: existingReview.nombreEtoile,
        commentaire: existingReview.commentaire || ''
      });
    } else {
      this.isEditMode.set(false);
      this.reviewForm.reset({ nombreEtoile: 5, commentaire: '' });
    }

    this.showReviewForm.update(v => !v);
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ nombreEtoile: rating });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) return;

    const user = this.authService.getCurrentUser();
    if (!user || !this.magasin()) return;

    this.isSubmitting.set(true);
    const reviewData = {
      nombreEtoile: this.reviewForm.value.nombreEtoile!,
      commentaire: this.reviewForm.value.commentaire || ''
    };

    const existingReview = this.userReview();
    const request$ = existingReview
      ? this.magasinService.updateReview(existingReview._id, reviewData)
      : this.magasinService.addReview({
          magasin: this.magasin()!._id,
          ...reviewData
        });

    console.log(request$);
    request$.subscribe({
      next: () => {
        const message = existingReview ? 'Avis modifié avec succès' : 'Avis ajouté avec succès';
        this.snackBar.open(message, 'OK', { duration: 2000 });
        this.reviewForm.reset({ nombreEtoile: 5, commentaire: '' });
        this.showReviewForm.set(false);
        this.isEditMode.set(false);
        this.loadAvis(this.magasin()!._id);
        this.loadMagasin(this.magasin()!._id);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de l\'opération', 'Fermer', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  onAddToCart(produit: ProduitFront): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.snackBar.open('Vous devez être connecté', 'Fermer', { duration: 2000 });
      return;
    }
    this.panierService.addToCart(produit._id, user.id).subscribe({
      next: () => this.snackBar.open(`${produit.nomProduit} ajouté au panier`, 'OK', { duration: 2000 }),
      error: (err) => this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 })
    });
  }

  onAddToFavoris(produit: ProduitFront): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.snackBar.open('Vous devez être connecté', 'Fermer', { duration: 2000 });
      return;
    }
    this.favoriesService.addToFavoris(produit._id, user.id).subscribe({
      next: () => this.snackBar.open(`${produit.nomProduit} ajouté aux favoris`, 'OK', { duration: 2000 }),
      error: (err) => this.snackBar.open(err.error?.message || 'Erreur', 'Fermer', { duration: 3000 })
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isMyReview(review: AvisMagasin): boolean {
    const user = this.authService.getCurrentUser();
    return user ? review.appUser._id === user.id : false;
  }

  getReviewAuthorName(review: AvisMagasin): string {
    return this.isMyReview(review) ? 'Votre avis' : review.appUser.name || 'Utilisateur';
  }

  deleteReview(reviewId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre avis ?')) {
      return;
    }

    this.magasinService.deleteReview(reviewId).subscribe({
      next: () => {
        this.snackBar.open('Avis supprimé avec succès', 'OK', { duration: 2000 });
        this.userReview.set(null);
        this.loadAvis(this.magasin()!._id);
        this.loadMagasin(this.magasin()!._id);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de la suppression', 'Fermer', { duration: 3000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/shop/magasins']);
  }
}
