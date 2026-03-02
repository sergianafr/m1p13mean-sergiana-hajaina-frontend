import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface StockProduit {
  _id: string;
  nomProduit: string;
  descriptionProduit?: string;
  seuilNotification?: number;
  photos?: { url: string; dateAjout: Date }[];
  unite: { _id: string; nomUnite: string };
  typeProduit: { _id: string; nomTypeProduit: string };
  magasin: { _id: string; nomMagasin: string };
  stockActuel: number;
}

export interface MvtStock {
  _id: string;
  qteEntree: number;
  qteSortie: number;
  dateMvtStock: Date;
  unite?: { _id: string; nomUnite: string } | null;
  produit: { _id: string; nomProduit: string };
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/mvt-stocks`;

  getStockByMagasin(magasinId: string): Observable<StockProduit[]> {
    return this.http.get<StockProduit[]>(`${this.apiUrl}/magasin/${magasinId}`);
  }

  getStockByProduit(produitId: string): Observable<{ stock: number }> {
    return this.http.get<{ stock: number }>(`${this.apiUrl}/produit/${produitId}`);
  }

  getMvtsByProduit(produitId: string): Observable<MvtStock[]> {
    return this.http.get<MvtStock[]>(`${this.apiUrl}/produit/${produitId}/mouvements`);
  }

  createMvtStock(data: { produit: string; unite: string; qteEntree?: number; qteSortie?: number; dateMvtStock?: string }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
