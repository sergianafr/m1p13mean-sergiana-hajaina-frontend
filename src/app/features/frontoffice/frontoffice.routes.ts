import { Routes } from '@angular/router';

export const frontofficeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shop-layout/shop-layout.component').then(m => m.ShopLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.component').then(m => m.ShopHomeComponent)
      },
      {
        path: 'produit/:id',
        loadComponent: () =>
          import('./pages/details-produit/details-produit.component').then(m => m.DetailsProduitComponent)
      },
      {
        path: 'favoris',
        loadComponent: () =>
          import('./pages/favories/favories.component').then(m => m.FavoriesComponent)
      },
      {
        path: 'panier',
        loadComponent: () =>
          import('./pages/panier/panier.component').then(m => m.PanierComponent)
      }
    ]
  }
];
