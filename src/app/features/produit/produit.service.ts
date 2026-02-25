import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from '../../core/services/crud.service';
import { environment } from '../../../environments/environment';

export interface PhotoProduit {
  url: string;
  dateAjout: Date;
}

export interface Produit {
  _id?: string;
  nomProduit: string;
  descriptionProduit?: string;
  seuilNotification?: number;
  photos?: PhotoProduit[];
  unite: string;
  typeProduit: string;
  magasin: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProduitDTO {
  nomProduit: string;
  descriptionProduit?: string;
  seuilNotification?: number;
  unite: string;
  typeProduit: string;
  magasin: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProduitService extends CrudService<Produit> {
  private readonly httpClient = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  constructor() {
    super();
    this.setEndpoint('produits');
  }

  createWithPhotos(dto: ProduitDTO, photos: File[]): Observable<Produit> {
    const formData = new FormData();

    formData.append('nomProduit', dto.nomProduit);
    if (dto.descriptionProduit) {
      formData.append('descriptionProduit', dto.descriptionProduit);
    }
    if (dto.seuilNotification !== undefined) {
      formData.append('seuilNotification', dto.seuilNotification.toString());
    }
    formData.append('unite', dto.unite);
    formData.append('typeProduit', dto.typeProduit);
    formData.append('magasin', dto.magasin);

    photos.forEach((photo) => {
      formData.append('photos', photo, photo.name);
    });

    return this.httpClient.post<Produit>(`${this.apiUrl}/produits`, formData);
  }
}
