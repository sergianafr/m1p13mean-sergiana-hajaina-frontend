import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';

import {
  AvisMagasin as FrontAvisMagasin,
  MagasinService as FrontMagasinService
} from '../../frontoffice/data-access/services/magasin.service';
import {
  AvisProduit as FrontAvisProduit,
  ProductService as FrontProductService
} from '../../frontoffice/data-access/services/produit.service';

import { Magasin } from '../magasin/magasin.service';
import { Produit } from '../produit/produit.service';

type LiteMagasin = {
  _id: string;
  nomMagasin: string;
};

type LiteProduit = {
  _id: string;
  nomProduit: string;
  magasinId?: string;
  nomMagasin?: string;
};

export type AvisMagasinBackoffice = FrontAvisMagasin & {
  magasinInfo: LiteMagasin;
};

export type AvisProduitBackoffice = FrontAvisProduit & {
  produitInfo: LiteProduit;
};

@Injectable({
  providedIn: 'root'
})
export class AvisBackofficeService {
  private readonly frontMagasinService = inject(FrontMagasinService);
  private readonly frontProductService = inject(FrontProductService);

  getAvisMagasinsByMagasins(magasins: Magasin[]): Observable<AvisMagasinBackoffice[]> {
    const magasinRefs = magasins
      .map(magasin => ({
        _id: String(magasin._id ?? ''),
        nomMagasin: magasin.nomMagasin
      }))
      .filter(magasin => magasin._id.length > 0);

    if (!magasinRefs.length) {
      return of([]);
    }

    const requests = magasinRefs.map(magasin =>
      this.frontMagasinService.getReviewsByMagasinId(magasin._id).pipe(
        map(avis => this.mapAvisMagasin(avis, magasin))
      )
    );

    return forkJoin(requests).pipe(
      map(result => result.flat().sort((a, b) => this.toTimestamp(b.dateAjout) - this.toTimestamp(a.dateAjout)))
    );
  }

  getAvisProduitsByProduits(produits: Produit[]): Observable<AvisProduitBackoffice[]> {
    const produitRefs = produits
      .map(produit => ({
        _id: String(produit._id ?? ''),
        nomProduit: produit.nomProduit,
        magasinId: this.extractMagasinId(produit.magasin),
        nomMagasin: this.extractMagasinName(produit.magasin)
      }))
      .filter(produit => produit._id.length > 0);

    if (!produitRefs.length) {
      return of([]);
    }

    const requests = produitRefs.map(produit =>
      this.frontProductService.getReviewsByProduitId(produit._id).pipe(
        map(avis => this.mapAvisProduit(avis, produit))
      )
    );

    return forkJoin(requests).pipe(
      map(result => result.flat().sort((a, b) => this.toTimestamp(b.dateAjout) - this.toTimestamp(a.dateAjout)))
    );
  }

  private mapAvisMagasin(
    avis: FrontAvisMagasin[],
    magasin: LiteMagasin
  ): AvisMagasinBackoffice[] {
    return avis.map(item => ({
      ...item,
      magasinInfo: magasin
    }));
  }

  private mapAvisProduit(
    avis: FrontAvisProduit[],
    produit: LiteProduit
  ): AvisProduitBackoffice[] {
    return avis.map(item => ({
      ...item,
      produitInfo: produit
    }));
  }

  private extractMagasinId(
    magasin: Produit['magasin']
  ): string | undefined {
    if (!magasin) {
      return undefined;
    }

    if (typeof magasin === 'string') {
      return magasin;
    }

    const id = magasin._id;
    return typeof id === 'string' && id.length > 0 ? id : undefined;
  }

  private extractMagasinName(
    magasin: Produit['magasin']
  ): string | undefined {
    if (!magasin || typeof magasin === 'string') {
      return undefined;
    }

    const name = magasin.nomMagasin;
    return typeof name === 'string' && name.length > 0 ? name : undefined;
  }

  private toTimestamp(value: Date | string): number {
    return new Date(value).getTime();
  }
}
