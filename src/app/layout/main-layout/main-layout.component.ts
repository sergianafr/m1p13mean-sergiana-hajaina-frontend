import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatDrawerMode } from '@angular/material/sidenav';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    MatSidenavModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './main-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isHandset = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map(result => result.matches)),
    { initialValue: false }
  );

  protected readonly sidenavOpened = signal(true);
  protected readonly sidenavMode = computed<MatDrawerMode>(() => (this.isHandset() ? 'over' : 'side'));

  constructor() {
    effect(() => {
      this.sidenavOpened.set(!this.isHandset());
    });
  }

  toggleSidenav(): void {
    this.sidenavOpened.update(opened => !opened);
  }

  closeIfHandset(): void {
    if (this.isHandset()) {
      this.sidenavOpened.set(false);
    }
  }

}
