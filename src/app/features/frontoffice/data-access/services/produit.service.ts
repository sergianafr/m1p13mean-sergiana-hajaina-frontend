import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface PhotoProduit {
  url: string;
  dateAjout: Date;
}

export interface ProduitFront {
  _id: string;
  nomProduit: string;
  descriptionProduit?: string;
  photos: PhotoProduit[];
  unite?: { _id: string; nomUnite: string } | null;
  typeProduit?: { _id: string; nomTypeProduit: string } | null;
  magasin?: { _id: string; nomMagasin: string } | null;
  prixActuel: number | null;
  averageRating?: number;
  totalReviews?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvisProduit {
  _id: string;
  commentaire: string;
  nombreEtoile: number;
  dateAjout: Date;
  produit: string;
  appUser: {
    _id: string;
    name: string;
  };
}

export interface CreateAvisProduitDto {
  commentaire: string;
  nombreEtoile: number;
  produit: string;
}

export interface UpdateAvisProduitDto {
  commentaire?: string;
  nombreEtoile?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllProduits(): Observable<ProduitFront[]> {
    return this.http.get<ProduitFront[]>(`${this.apiUrl}/produits`);
  }

  getAllProduitsWithRatings(): Observable<ProduitFront[]> {
    return this.http.get<ProduitFront[]>(`${this.apiUrl}/produits/with-ratings`);
  }

  getRandomProduits(count: number = 20): Observable<ProduitFront[]> {
    return this.getAllProduitsWithRatings().pipe(
      map(produits => this.shuffleArray(produits).slice(0, count))
    );
  }

  getProduitById(id: string): Observable<ProduitFront> {
    return this.http.get<ProduitFront>(`${this.apiUrl}/produits/${id}`);
  }

  getProduitByIdWithRating(id: string): Observable<ProduitFront> {
    return this.http.get<ProduitFront>(`${this.apiUrl}/produits/${id}/with-rating`);
  }

  getReviewsByProduitId(id: string): Observable<AvisProduit[]> {
    return this.http.get<AvisProduit[]>(`${this.apiUrl}/produits/${id}/avis`);
  }

  addReview(dto: CreateAvisProduitDto): Observable<{ message: string; avisProduit: AvisProduit }> {
    return this.http.post<{ message: string; avisProduit: AvisProduit }>(
      `${this.apiUrl}/avis-produits`,
      dto
    );
  }

  updateReview(id: string, dto: UpdateAvisProduitDto): Observable<{ message: string; avisProduit: AvisProduit }> {
    return this.http.put<{ message: string; avisProduit: AvisProduit }>(
      `${this.apiUrl}/avis-produits/${id}`,
      dto
    );
  }

  deleteReview(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/avis-produits/${id}`);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
