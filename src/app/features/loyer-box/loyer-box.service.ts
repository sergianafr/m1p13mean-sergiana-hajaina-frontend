import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from '../../core/services/crud.service';
import { environment } from '../../../environments/environment';
import { Box } from '../box/box.service';

export interface LoyerBox {
  _id?: string;
  montantLoyer: number;
  dateDebut: Date;
  dateFin?: Date;
  box: string | Box;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LoyerBoxService extends CrudService<LoyerBox> {
  private readonly httpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/loyer-boxs`;

  constructor() {
    super();
    this.setEndpoint('loyer-boxs');
  }

  getByBox(boxId: string): Observable<LoyerBox[]> {
    return this.httpClient.get<LoyerBox[]>(`${this.apiUrl}/box/${boxId}`);
  }

  getCurrentByBox(boxId: string): Observable<LoyerBox | null> {
    return this.httpClient.get<LoyerBox | null>(`${this.apiUrl}/box/${boxId}/current`);
  }
}
