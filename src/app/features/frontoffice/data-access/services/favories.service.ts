import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface FavoriItem {
  _id: string;
  dateAjout: Date;
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
export class FavoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/favoris`;

  getFavorisByUser(userId: string): Observable<FavoriItem[]> {
    return this.http.get<FavoriItem[]>(`${this.apiUrl}/user/${userId}`);
  }

  addToFavoris(produitId: string, userId: string): Observable<any> {
    return this.http.post(this.apiUrl, { produit: produitId, appUser: userId });
  }

  removeFromFavoris(produitId: string, userId: string): Observable<any> {
    return this.http.delete(this.apiUrl, {
      body: { produit: produitId, appUser: userId }
    });
  }
}
