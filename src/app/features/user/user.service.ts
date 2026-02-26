import { Injectable } from '@angular/core';
import { CrudService } from '../../core/services/crud.service';

export interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'CLIENT' | 'BOUTIQUE' | 'ADMIN';
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends CrudService<User> {
  constructor() {
    super();
    this.setEndpoint('users');
  }
}
