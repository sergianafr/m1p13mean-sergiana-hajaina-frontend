import { Injectable } from '@angular/core';
import { CrudService } from '../../core/services/crud.service';

export interface TypeMagasin {
  _id?: string;
  nomTypeMagasin: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TypeMagasinService extends CrudService<TypeMagasin> {
  constructor() {
    super();
    this.setEndpoint('type-magasins');
  }
}
