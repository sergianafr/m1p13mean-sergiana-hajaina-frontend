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
  unite: { _id: string; nomUnite: string };
  typeProduit: { _id: string; nomTypeProduit: string };
  magasin: { _id: string; nomMagasin: string };
  prixActuel: number | null;
  createdAt: Date;
  updatedAt: Date;
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

  getRandomProduits(count: number = 20): Observable<ProduitFront[]> {
    return this.getAllProduits().pipe(
      map(produits => this.shuffleArray(produits).slice(0, count))
    );
  }

  getProduitById(id: string): Observable<ProduitFront> {
    return this.http.get<ProduitFront>(`${this.apiUrl}/produits/${id}`);
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
