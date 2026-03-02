import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from '../../../core/services/crud.service';
import { environment } from '../../../../environments/environment';

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
  magasin: string | { _id: string; nomMagasin: string };
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
  prixUnitaire?: number;
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
    if (dto.prixUnitaire !== undefined && dto.prixUnitaire !== null) {
      formData.append('prixUnitaire', dto.prixUnitaire.toString());
    }

    photos.forEach((photo) => {
      formData.append('photos', photo, photo.name);
    });

    return this.httpClient.post<Produit>(`${this.apiUrl}/produits`, formData);
  }

  updateWithPhotos(id: string, dto: ProduitDTO, photos: File[]): Observable<Produit> {
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

    return this.httpClient.put<Produit>(`${this.apiUrl}/produits/${id}`, formData);
  }

  deletePhotoByUrl(produitId: string, imageUrl: string): Observable<Produit> {
    const params = new HttpParams().set('imageUrl', imageUrl);
    return this.httpClient.delete<Produit>(`${this.apiUrl}/produits/${produitId}/photos`, {
      params
    });
  }
}
