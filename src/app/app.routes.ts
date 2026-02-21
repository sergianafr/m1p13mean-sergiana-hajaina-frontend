import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/all/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'type-produits',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/type-produit/type-produit-list.component').then(m => m.TypeProduitListComponent)
      },
      {
        path: 'type-produits/nouveau',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/type-produit/type-produit.component').then(m => m.TypeProduitForm)
      },
      {
        path: 'type-produits/:id',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/type-produit/type-produit.component').then(m => m.TypeProduitForm)
      },
      {
        path: 'type-produit',
        redirectTo: 'type-produits',
        pathMatch: 'full'
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
 