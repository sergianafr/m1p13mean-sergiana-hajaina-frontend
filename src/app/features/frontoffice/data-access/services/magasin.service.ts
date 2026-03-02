import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProduitFront } from './produit.service';

export interface PromotionInfo {
  _id: string;
  pourcentage: number;
  dateDebut: Date;
  dateFin: Date;
  qte: number;
}

export interface TypeMagasin {
  _id: string;
  nomTypeMagasin: string;
}

export interface MagasinFront {
  _id: string;
  nomMagasin: string;
  dateAjout: Date;
  nif?: string;
  stat?: string;
  appUser: {
    _id: string;
    username: string;
    email: string;
  };
  typeMagasin?: TypeMagasin | null;
  averageRating?: number;
  totalReviews?: number;
  promotion?: PromotionInfo | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvisMagasin {
  _id: string;
  dateAjout: Date;
  commentaire?: string;
  nombreEtoile: number;
  magasin: string;
  appUser: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateAvisMagasinDto {
  nombreEtoile: number;
  commentaire?: string;
}

export interface AddAvisMagasinDto {
  magasin: string;
  commentaire?: string;
  nombreEtoile: number;
}

@Injectable({
  providedIn: 'root'
})
export class MagasinService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllMagasins(): Observable<MagasinFront[]> {
    return this.http.get<MagasinFront[]>(`${this.apiUrl}/magasins`);
  }

  getAllMagasinsWithRatings(): Observable<MagasinFront[]> {
    return this.http.get<MagasinFront[]>(`${this.apiUrl}/magasins/with-ratings`);
  }

  getMagasinById(id: string): Observable<MagasinFront> {
    return this.http.get<MagasinFront>(`${this.apiUrl}/magasins/${id}`);
  }

  getMagasinByIdWithRating(id: string): Observable<MagasinFront> {
    return this.http.get<MagasinFront>(`${this.apiUrl}/magasins/${id}/with-rating`);
  }

  getProductsByMagasinId(id: string): Observable<ProduitFront[]> {
    return this.http.get<ProduitFront[]>(`${this.apiUrl}/magasins/${id}/produits`);
  }

  getReviewsByMagasinId(id: string): Observable<AvisMagasin[]> {
    return this.http.get<AvisMagasin[]>(`${this.apiUrl}/magasins/${id}/avis`);
  }

  addReview(reviewData: AddAvisMagasinDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/avis-magasins`, reviewData);
  }

  updateReview(reviewId: string, reviewData: UpdateAvisMagasinDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/avis-magasins/${reviewId}`, reviewData);
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/avis-magasins/${reviewId}`);
  }
}
