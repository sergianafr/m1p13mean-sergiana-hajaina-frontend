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
import { BoutiqueDashboard } from '../../../../core/models/dashboard';
import { Magasin, MagasinService } from '../../magasin/magasin.service';

@Component({
  selector: 'app-dashboard-boutique',
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
  templateUrl: './dashboard-boutique.component.html',
  styleUrl: './dashboard-boutique.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardBoutiqueComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly magasinService = inject(MagasinService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(false);
  protected readonly isLoadingMagasins = signal(false);
  protected readonly dashboard = signal<BoutiqueDashboard | null>(null);

  protected readonly magasins = signal<Magasin[]>([]);
  protected readonly selectedMagasinId = signal<string>('');

  protected readonly selectedYear = signal<number>(new Date().getFullYear());
  protected readonly availableYears = computed(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2];
  });

  protected readonly totalRevenueYear = computed(() => {
    const monthly = this.dashboard()?.monthly ?? [];
    return monthly.reduce((sum, m) => sum + (m.revenue || 0), 0);
  });

  protected readonly maxVentesQte = computed(() => {
    const topVentes = this.dashboard()?.topProduitsByVentes ?? [];
    if (topVentes.length === 0) return 0;
    return Math.max(...topVentes.map(p => p.qteVendue || 0));
  });

  ngOnInit(): void {
    this.loadMagasins();
  }

  protected onMagasinChange(magasinId: string): void {
    this.selectedMagasinId.set(magasinId);
    this.loadDashboard();
  }

  protected onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loadDashboard();
  }

  private loadMagasins(): void {
    this.isLoadingMagasins.set(true);
    this.magasinService.getMine().subscribe({
      next: (data) => {
        this.magasins.set(data);
        this.isLoadingMagasins.set(false);
        if (data.length > 0) {
          this.selectedMagasinId.set(data[0]._id!);
          this.loadDashboard();
        }
      },
      error: () => {
        this.isLoadingMagasins.set(false);
        this.snackBar.open('Erreur lors du chargement des boutiques', 'Fermer', { duration: 3000 });
      }
    });
  }

  private loadDashboard(): void {
    const magasinId = this.selectedMagasinId();
    if (!magasinId) return;

    this.isLoading.set(true);
    this.dashboardService.getBoutiqueDashboard({ magasinId, year: this.selectedYear() }).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement du dashboard boutique', 'Fermer', { duration: 3000 });
      }
    });
  }
}
