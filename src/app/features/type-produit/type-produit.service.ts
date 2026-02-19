import { Injectable } from '@angular/core';
import { CrudService } from '../../core/services/crud.service';

export interface TypeProduit {
  _id?: string;
  nomTypeProduit: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TypeProduitService extends CrudService<TypeProduit> {
  constructor() {
    super();
    this.setEndpoint('type-produits');
  }
}
