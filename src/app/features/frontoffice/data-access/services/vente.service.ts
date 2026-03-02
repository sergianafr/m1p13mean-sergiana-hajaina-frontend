import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface VenteDetailItem {
  _id: string;
  qte: number;
  prixUnitaire: number;
  prixTotal: number;
  pourcentagePromotion: number;
  produit?: {
    _id: string;
    nomProduit: string;
    photos?: { url: string; dateAjout: Date }[];
    unite?: { _id: string; nomUnite: string } | null;
    typeProduit?: { _id: string; nomTypeProduit: string } | null;
    magasin?: { _id: string; nomMagasin: string } | null;
  } | null;
}

export interface VenteItem {
  _id: string;
  dateVente: Date;
  totalPrix: number;
  pourcentagePromotion: number;
  magasin?: { _id: string; nomMagasin: string } | null;
  details: VenteDetailItem[];
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class VenteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ventes`;

  checkout(details: { produit: string; qte: number }[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/achat`, { details });
  }

  getTraites(): Observable<VenteItem[]> {
    return this.http.get<VenteItem[]>(`${this.apiUrl}/user`);
  }
}
