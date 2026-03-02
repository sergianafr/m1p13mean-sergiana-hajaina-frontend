import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminDashboard, BoutiqueDashboard } from '../models/dashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAdminDashboard(params?: { year?: number; days?: number }): Observable<AdminDashboard> {
    let httpParams = new HttpParams();
    if (params?.year) httpParams = httpParams.set('year', params.year.toString());
    if (params?.days) httpParams = httpParams.set('days', params.days.toString());

    return this.http.get<AdminDashboard>(`${this.apiUrl}/dashboard/admin`, { params: httpParams });
  }

  getBoutiqueDashboard(params?: { magasinId?: string; year?: number; days?: number }): Observable<BoutiqueDashboard> {
    let httpParams = new HttpParams();
    if (params?.magasinId) httpParams = httpParams.set('magasinId', params.magasinId);
    if (params?.year) httpParams = httpParams.set('year', params.year.toString());
    if (params?.days) httpParams = httpParams.set('days', params.days.toString());

    return this.http.get<BoutiqueDashboard>(`${this.apiUrl}/dashboard/boutique`, { params: httpParams });
  }
}
