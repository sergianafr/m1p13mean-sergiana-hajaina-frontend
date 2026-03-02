import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import { Role } from '../../core/models/user';

type NavItem = {
  label: string;
  icon: string;
  link: string;
  roles?: Role[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive, HasRoleDirective],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly navigate = output<void>();

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard_customize', link: '/dashboard/admin', roles: ['ADMIN'] },
    { label: 'Dashboard', icon: 'space_dashboard', link: '/dashboard/boutique', roles: ['BOUTIQUE'] },
    { label: 'Type produit', icon: 'category', link: '/type-produits', roles: ['ADMIN', 'BOUTIQUE'] },
    { label: 'Type magasin', icon: 'storefront', link: '/type-magasins', roles: ['ADMIN'] },
    { label: 'Unite', icon: 'straighten', link: '/unites', roles: ['ADMIN', 'BOUTIQUE'] },
    { label: 'Box', icon: 'inventory_2', link: '/boxs', roles: ['ADMIN'] },
    { label: 'Assignation Magasin-Box', icon: 'lan', link: '/box-magasins', roles: ['ADMIN'] },
    { label: 'Paiements loyers', icon: 'payments', link: '/paiement-loyers', roles: ['ADMIN', 'BOUTIQUE'] },
    { label: 'Suivi loyers', icon: 'fact_check', link: '/paiement-loyers/suivi', roles: ['ADMIN'] },
    { label: 'Magasin', icon: 'store', link: '/magasins', roles: ['ADMIN', 'BOUTIQUE'] },
    { label: 'Produit', icon: 'shopping_bag', link: '/produits', roles: ['BOUTIQUE'] },
    { label: 'Avis magasins', icon: 'rate_review', link: '/avis-magasins', roles: ['ADMIN', 'BOUTIQUE'] },
    { label: 'Avis produits', icon: 'reviews', link: '/avis-produits', roles: ['ADMIN', 'BOUTIQUE'] },
    { label: 'Stock', icon: 'inventory', link: '/stocks', roles: ['BOUTIQUE'] },
    { label: 'Utilisateurs', icon: 'group', link: '/users', roles: ['ADMIN'] },
    { label: 'Promotion', icon: 'local_offer', link: '/promotions', roles: ['BOUTIQUE'] },
  ];

}

