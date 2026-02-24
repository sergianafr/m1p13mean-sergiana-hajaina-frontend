import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-50">
      <div class="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <mat-icon class="text-red-500 text-6xl mb-4">block</mat-icon>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Accès Refusé</h1>
        <p class="text-gray-600 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="goHome()"
          class="w-full"
        >
          <mat-icon>home</mat-icon>
          Retour à l'accueil
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessDeniedComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
