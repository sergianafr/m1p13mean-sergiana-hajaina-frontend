import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

type NavItem = {
  label: string;
  icon: string;
  link: string;
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly navigate = output<void>();

  protected readonly navItems: NavItem[] = [
    { label: 'Home', icon: 'home', link: '/home' },
    { label: 'Profile', icon: 'person', link: '/profile' },
    { label: 'Settings', icon: 'settings', link: '/settings' },
    { label: 'Type produit', icon: 'settings', link: '/type-produit' },


  ];

}
