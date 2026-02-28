import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface PanierItem {
  _id: string;
  qte: number;
  produit: {
    _id: string;
    nomProduit: string;
    descriptionProduit?: string;
    photos: { url: string; dateAjout: Date }[];
    unite: { _id: string; nomUnite: string };
    typeProduit: { _id: string; nomTypeProduit: string };
    magasin: { _id: string; nomMagasin: string };
  };
  appUser: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/paniers`;

  getCartByUser(userId: string): Observable<PanierItem[]> {
    return this.http.get<PanierItem[]>(`${this.apiUrl}/user/${userId}`);
  }

  addToCart(produitId: string, userId: string, qte: number = 1): Observable<any> {
    return this.http.post(this.apiUrl, { produit: produitId, appUser: userId, qte });
  }

  removeFromCart(produitId: string, userId: string): Observable<any> {
    return this.http.delete(this.apiUrl, {
      body: { produit: produitId, appUser: userId }
    });
  }
}
