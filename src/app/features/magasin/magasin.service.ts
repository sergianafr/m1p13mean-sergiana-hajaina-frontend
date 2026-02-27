import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from '../../core/services/crud.service';
import { environment } from '../../../environments/environment';

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface TypeMagasin {
  _id: string;
  nomTypeMagasin: string;
}

export interface Magasin {
  _id?: string;
  nomMagasin: string;
  dateAjout?: Date;
  nif?: string;
  stat?: string;
  appUser: string | User;
  typeMagasin: string | TypeMagasin;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class MagasinService extends CrudService<Magasin> {
  private readonly httpClient = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  constructor() {
    super();
    this.setEndpoint('magasins');
  }

  // Récupérer tous les utilisateurs (pour le select)
  getAllUsers(): Observable<User[]> {
    // return this.httpClient.get<User[]>(`${this.apiUrl}/users`);
    return this.httpClient.get<User[]>(`${this.apiUrl}/users/role/BOUTIQUE`);
  }

  // Récupérer tous les types de magasin (pour le select)
  getAllTypeMagasins(): Observable<TypeMagasin[]> {
    return this.httpClient.get<TypeMagasin[]>(`${this.apiUrl}/type-magasins`);
  }
}
