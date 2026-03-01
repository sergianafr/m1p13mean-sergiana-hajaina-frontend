import { Injectable } from '@angular/core';
import { CrudService } from '../../../core/services/crud.service';

export interface Promotion {
  _id?: string;
  qte: number;
  pourcentage: number;
  dateDebut: Date;
  dateFin: Date;
  produit?: {
    _id: string;
    nomProduit: string;
  };
  magasin?: {
    _id: string;
    nomMagasin: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PromotionDTO {
  qte: number;
  pourcentage: number;
  dateDebut: Date | string;
  dateFin: Date | string;
  produit?: string;
  magasin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService extends CrudService<Promotion> {
  constructor() {
    super();
    this.setEndpoint('promotions');
  }
}
