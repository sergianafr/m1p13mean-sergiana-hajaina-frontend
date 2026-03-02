import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PaiementLoyerEntity {
  _id?: string;
  magasin: string | { _id: string; nomMagasin: string };
  details?: Array<{
    box: string | { _id: string; nomBox: string; aireBox?: number };
    loyerBox: string | { _id: string; montantLoyer: number; dateDebut?: Date; dateFin?: Date };
    montantLoyer: number;
  }>;
  mois: number;
  annee: number;
  datePaiement: Date | string;
  montantPaye: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaiementLoyerFilters {
  magasin?: string;
  box?: string;
  mois?: number;
  annee?: number;
  page?: number;
  limit?: number;
}

export interface PaiementLoyerListResult {
  items: PaiementLoyerEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaiementLoyerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/paiement-loyers`;

  getPaiements(filters: PaiementLoyerFilters = {}): Observable<PaiementLoyerListResult> {
    return this.http
      .get<ApiEnvelope<PaiementLoyerListResult>>(this.apiUrl, {
        params: this.toParams(filters)
      })
      .pipe(map(response => response.data));
  }

  getPaiementsByMagasin(magasinId: string, filters: PaiementLoyerFilters = {}): Observable<PaiementLoyerListResult> {
    return this.http
      .get<ApiEnvelope<PaiementLoyerListResult>>(`${this.apiUrl}/magasin/${magasinId}`, {
        params: this.toParams(filters)
      })
      .pipe(map(response => response.data));
  }

  createPaiement(payload: Partial<PaiementLoyerEntity>): Observable<PaiementLoyerEntity> {
    return this.http
      .post<ApiEnvelope<PaiementLoyerEntity>>(this.apiUrl, payload)
      .pipe(map(response => response.data));
  }

  private toParams(filters: PaiementLoyerFilters): HttpParams {
    let params = new HttpParams();

    if (filters.magasin) params = params.set('magasin', filters.magasin);
    if (filters.box) params = params.set('box', filters.box);
    if (filters.mois) params = params.set('mois', String(filters.mois));
    if (filters.annee) params = params.set('annee', String(filters.annee));
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));

    return params;
  }
}
