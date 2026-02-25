import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent)
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
        path: 'access-denied',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/all/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
      },
      {
        path: 'type-produits',
        canActivate: [authGuard, roleGuard(['ADMIN', 'BOUTIQUE'])],
        loadComponent: () =>
          import('./features/type-produit/type-produit-list.component').then(m => m.TypeProduitListComponent)
      },
      {
        path: 'type-produits/create',
        canActivate: [authGuard, roleGuard(['ADMIN', 'BOUTIQUE'])],
        loadComponent: () =>
          import('./features/type-produit/type-produit.component').then(m => m.TypeProduitForm)
      },
      {
        path: 'type-produits/:id',
        canActivate: [authGuard, roleGuard(['ADMIN', 'BOUTIQUE'])],
        loadComponent: () =>
          import('./features/type-produit/type-produit.component').then(m => m.TypeProduitForm)
      },
      {
        path: 'type-produit',
        redirectTo: 'type-produits',
        pathMatch: 'full'
      },
      {
        path: 'type-magasins',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/type-magasin/pages/type-magasin-list/type-magasin-list.component').then(m => m.TypeMagasinListComponent)
      },
      {
        path: 'type-magasins/create',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/type-magasin/pages/type-magasin-form/type-magasin-form.component').then(m => m.TypeMagasinFormComponent)
      },
      {
        path: 'type-magasins/:id',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/type-magasin/pages/type-magasin-form/type-magasin-form.component').then(m => m.TypeMagasinFormComponent)
      },
      {
        path: 'type-magasin',
        redirectTo: 'type-magasins',
        pathMatch: 'full'
      },
      {
        path: 'unites',
        canActivate: [authGuard, roleGuard(['ADMIN', 'BOUTIQUE'])],
        loadComponent: () =>
          import('./features/unite/pages/unite-list/unite-list.component').then(m => m.UniteListComponent)
      },
      {
        path: 'unites/create',
        canActivate: [authGuard, roleGuard(['ADMIN', 'BOUTIQUE'])],
        loadComponent: () =>
          import('./features/unite/pages/unite-form/unite-form.component').then(m => m.UniteFormComponent)
      },
      {
        path: 'unites/:id',
        canActivate: [authGuard, roleGuard(['ADMIN', 'BOUTIQUE'])],
        loadComponent: () =>
          import('./features/unite/pages/unite-form/unite-form.component').then(m => m.UniteFormComponent)
      },
      {
        path: 'unite',
        redirectTo: 'unites',
        pathMatch: 'full'
      },
      {
        path: 'boxs',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/box/pages/box-list/box-list.component').then(m => m.BoxListComponent)
      },
      {
        path: 'boxs/create',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/box/pages/box-form/box-form.component').then(m => m.BoxFormComponent)
      },
      {
        path: 'boxs/:id',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/box/pages/box-form/box-form.component').then(m => m.BoxFormComponent)
      },
      {
        path: 'boxs/:boxId/loyers',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/loyer-box/loyer-box-list/loyer-box-list.component').then(m => m.LoyerBoxListComponent)
      },
      {
        path: 'boxs/:boxId/loyers/nouveau',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/loyer-box/loyer-box-form/loyer-box-form.component').then(m => m.LoyerBoxFormComponent)
      },
      {
        path: 'box',
        redirectTo: 'boxs',
        pathMatch: 'full'
      },
      {
        path: 'magasins',
        canActivate: [authGuard, roleGuard(['ADMIN', 'BOUTIQUE'])],
        loadComponent: () =>
          import('./features/pages/magasin-list/magasin-list.component').then(m => m.MagasinListComponent)
      },
      {
        path: 'magasins/nouveau',
        canActivate: [authGuard, roleGuard(['ADMIN', 'BOUTIQUE'])],
        loadComponent: () =>
          import('./features/pages/magasin-form/magasin-form.component').then(m => m.MagasinFormComponent)
      },
      {
        path: 'magasins/:id',
        canActivate: [authGuard, roleGuard(['ADMIN', 'BOUTIQUE'])],
        loadComponent: () =>
          import('./features/pages/magasin-form/magasin-form.component').then(m => m.MagasinFormComponent)
      },
      {
        path: 'magasin',
        redirectTo: 'magasins',
        pathMatch: 'full'
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      
    ]
  },
  { path: '**', redirectTo: 'login' }
];
 