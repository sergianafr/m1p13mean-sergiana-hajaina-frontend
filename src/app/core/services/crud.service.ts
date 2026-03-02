import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CrudService<T> {
  private readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.apiUrl;
  private endpoint = '';


  setEndpoint(endpoint: string): this {
    this.endpoint = endpoint;
    return this;
  }

  getAll(endpoint?: string, params?: PaginationParams): Observable<T[]> {
    const actualEndpoint = endpoint || this.endpoint;
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.order) httpParams = httpParams.set('order', params.order);
    }

    return this.http.get<T[]>(`${this.baseUrl}/${actualEndpoint}`, { params: httpParams });
  }

  getAllPaginated(endpoint?: string, params?: PaginationParams): Observable<PaginatedResponse<T>> {
    const actualEndpoint = endpoint || this.endpoint;
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.order) httpParams = httpParams.set('order', params.order);
    }

    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}/${actualEndpoint}/paginated`, { params: httpParams });
  }

  getById(id: string | number, endpoint?: string): Observable<T> {
    const actualEndpoint = endpoint || this.endpoint;
    return this.http.get<T>(`${this.baseUrl}/${actualEndpoint}/${id}`);
  }

  create(data: Partial<T>, endpoint?: string): Observable<T> {
    const actualEndpoint = endpoint || this.endpoint;
    return this.http.post<T>(`${this.baseUrl}/${actualEndpoint}`, data);
  }

  update(id: string | number, data: Partial<T>, endpoint?: string): Observable<T> {
    const actualEndpoint = endpoint || this.endpoint;
    return this.http.put<T>(`${this.baseUrl}/${actualEndpoint}/${id}`, data);
  }


  delete(id: string | number, endpoint?: string): Observable<void> {
    const actualEndpoint = endpoint || this.endpoint;
    return this.http.delete<void>(`${this.baseUrl}/${actualEndpoint}/${id}`);
  }

  search(query: string, endpoint?: string, params?: PaginationParams): Observable<T[]> {
    const actualEndpoint = endpoint || this.endpoint;
    let httpParams = new HttpParams().set('q', query);
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.order) httpParams = httpParams.set('order', params.order);
    }

    return this.http.get<T[]>(`${this.baseUrl}/${actualEndpoint}/search`, { params: httpParams });
  }



}
