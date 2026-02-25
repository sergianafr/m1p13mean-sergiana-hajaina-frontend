import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListHeaderComponent } from '../../../../shared/components';
import { BoxService, Box } from '../../box.service';
import { LoyerBoxService, LoyerBox } from '../../../loyer-box/loyer-box.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

interface BoxWithLoyer extends Box {
  loyerActuel?: LoyerBox | null;
}

@Component({
  selector: 'app-box-list',
  standalone: true,
  imports: [
    CommonModule,
    ListHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './box-list.component.html',
  styleUrl: './box-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoxListComponent implements OnInit {
  private readonly boxService = inject(BoxService);
  private readonly loyerBoxService = inject(LoyerBoxService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly boxs = signal<BoxWithLoyer[]>([]);
  protected readonly isLoading = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    
    this.boxService.getAll().subscribe({
      next: (boxes) => {
        if (boxes.length === 0) {
          this.boxs.set([]);
          this.isLoading.set(false);
          return;
        }

        const loyerRequests = boxes.map(box => this.loyerBoxService.getCurrentByBox(box._id!));
        
        forkJoin(loyerRequests).subscribe({
          next: (loyers) => {
            const boxsWithLoyer: BoxWithLoyer[] = boxes.map((box, index) => ({
              ...box,
              loyerActuel: loyers[index]
            }));
            this.boxs.set(boxsWithLoyer);
            this.isLoading.set(false);
          },
          error: () => {
            this.boxs.set(boxes.map(box => ({ ...box, loyerActuel: null })));
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  protected createNew(): void {
    this.router.navigate(['/boxs/nouveau']);
  }

  protected editBox(box: BoxWithLoyer): void {
    this.router.navigate(['/boxs', box._id]);
  }

  protected createLoyer(box: BoxWithLoyer): void {
    this.router.navigate(['/boxs', box._id, 'loyers', 'nouveau']);
  }

  protected viewHistorique(box: BoxWithLoyer): void {
    this.router.navigate(['/boxs', box._id, 'loyers']);
  }

  protected deleteBox(box: BoxWithLoyer): void {
    if (confirm(`Voulez-vous vraiment supprimer "${box.nomBox}" ?`)) {
      this.boxService.delete(box._id!).subscribe({
        next: () => {
          this.snackBar.open('Box supprim\u00e9 avec succ\u00e8s', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.loadData();
        },
        error: (error) => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          console.error('Erreur:', error);
        }
      });
    }
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(amount);
  }

  protected formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
