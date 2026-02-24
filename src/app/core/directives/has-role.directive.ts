import { Directive, inject, input, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly appHasRole = input.required<Role | Role[]>();

  constructor() {
    effect(() => {
      this.updateView();
    });
  }

  private updateView(): void {
    const user = this.authService.getCurrentUser();
    const allowedRoles = Array.isArray(this.appHasRole()) 
      ? this.appHasRole() 
      : [this.appHasRole()];

    this.viewContainer.clear();

    if (user && (allowedRoles as Role[]).includes(user.role)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
