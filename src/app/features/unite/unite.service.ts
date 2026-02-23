import { Injectable } from '@angular/core';
import { CrudService } from '../../core/services/crud.service';

export interface Unite {
  _id?: string;
  nomUnite: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UniteService extends CrudService<Unite> {
  constructor() {
    super();
    this.setEndpoint('unites');
  }
}
