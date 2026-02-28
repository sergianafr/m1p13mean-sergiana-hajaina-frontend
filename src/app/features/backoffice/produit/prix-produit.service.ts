import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PrixProduit {
  _id?: string;
  prixUnitaire: number;
  dateDebut: string | Date;
  dateFin?: string | Date | null;
  produit: string | any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePrixDTO {
  prixUnitaire: number;
  dateDebut: string;
  produit: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrixProduitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/prix-produits`;

  getByProduit(produitId: string): Observable<PrixProduit[]> {
    return this.http.get<PrixProduit[]>(`${this.apiUrl}/produit/${produitId}`);
  }

  getCurrentPrix(produitId: string): Observable<PrixProduit> {
    return this.http.get<PrixProduit>(`${this.apiUrl}/produit/${produitId}/current`);
  }

  create(data: CreatePrixDTO): Observable<{ message: string; prix: PrixProduit }> {
    return this.http.post<{ message: string; prix: PrixProduit }>(this.apiUrl, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
