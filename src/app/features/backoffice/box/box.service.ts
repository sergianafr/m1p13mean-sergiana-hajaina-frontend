import { Injectable } from '@angular/core';
import { CrudService } from '../../../core/services/crud.service';

export interface Box {
  _id?: string;
  nomBox: string;
  aireBox: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BoxService extends CrudService<Box> {
  constructor() {
    super();
    this.setEndpoint('boxs');
  }
}
