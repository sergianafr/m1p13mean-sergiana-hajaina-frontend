import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface FavoriItem {
  _id?: string;
  dateAjout: Date;
  produit: any;
  appUser: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/favoris`;

  addToFavoris(produitId: string, userId: string): Observable<any> {
    return this.http.post(this.apiUrl, { produit: produitId, appUser: userId });
  }

  removeFromFavoris(produitId: string, userId: string): Observable<any> {
    return this.http.delete(this.apiUrl, {
      body: { produit: produitId, appUser: userId }
    });
  }
}
