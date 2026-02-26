import { Injectable } from '@angular/core';
import { CrudService } from '../../core/services/crud.service';
import { Box } from '../box/box.service';
import { Magasin } from '../magasin.service';

export interface MagasinBox {
  _id?: string;
  magasin: string | Magasin;
  box: string | Box;
  dateDebut: Date;
  dateFin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BoxMagasinService extends CrudService<MagasinBox> {
  constructor() {
    super();
    this.setEndpoint('magasin-boxs');
  }
}
