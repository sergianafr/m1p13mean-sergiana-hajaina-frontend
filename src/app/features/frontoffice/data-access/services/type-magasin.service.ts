import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TypeMagasin } from './magasin.service';

@Injectable({
  providedIn: 'root'
})
export class TypeMagasinService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllTypeMagasins(): Observable<TypeMagasin[]> {
    return this.http.get<TypeMagasin[]>(`${this.apiUrl}/type-magasins`);
  }
}
