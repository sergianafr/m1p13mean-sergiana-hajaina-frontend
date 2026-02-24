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
    { label: 'Home', icon: 'home', link: '/home' },
    { label: 'Type produit', icon: 'bookmark_border', link: '/type-produits', roles: ['ADMIN', 'BOUTIQUE'] },
    { label: 'Type magasin', icon: 'bookmark_border', link: '/type-magasins', roles: ['ADMIN'] },
    { label: 'Unite', icon: 'bookmark_border', link: '/unites', roles: ['ADMIN', 'BOUTIQUE'] },
  ];

}

