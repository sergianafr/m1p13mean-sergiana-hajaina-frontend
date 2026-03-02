import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { ListHeaderComponent } from '../../../../shared';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { AdminDashboard, AdminMagasinStat } from '../../../../core/models/dashboard';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    ListHeaderComponent
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardAdminComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(false);
  protected readonly dashboard = signal<AdminDashboard | null>(null);

  protected readonly selectedYear = signal<number>(new Date().getFullYear());
  protected readonly availableYears = computed(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2];
  });

  protected readonly topMagasinsByYear = computed<AdminMagasinStat[]>(() => {
    const magasins = this.dashboard()?.magasins ?? [];
    return [...magasins].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5);
  });

  protected readonly totalRevenueYear = computed(() => {
    const monthly = this.dashboard()?.monthly ?? [];
    return monthly.reduce((sum, m) => sum + (m.revenue || 0), 0);
  });

  ngOnInit(): void {
    this.load();
  }

  protected onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.dashboardService.getAdminDashboard({ year: this.selectedYear() }).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement du dashboard admin', 'Fermer', { duration: 3000 });
      }
    });
  }
}
