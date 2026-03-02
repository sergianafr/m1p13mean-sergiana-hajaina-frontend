import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { TitleComponent } from '../../../../shared';
import { LoyerBoxService, LoyerBox } from '../loyer-box.service';
import { BoxService, Box } from '../../box/box.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-loyer-box-list',
  standalone: true,
  imports: [
    CommonModule,
    TitleComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './loyer-box-list.component.html',
  styleUrl: './loyer-box-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoyerBoxListComponent implements OnInit {
  private readonly loyerBoxService = inject(LoyerBoxService);
  private readonly boxService = inject(BoxService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loyers = signal<LoyerBox[]>([]);
  protected readonly box = signal<Box | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly boxId = signal<string>('');

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const boxId = params['boxId'];
      if (boxId) {
        this.boxId.set(boxId);
        this.loadBox(boxId);
        this.loadLoyers(boxId);
      }
    });
  }

  private loadBox(boxId: string): void {
    this.boxService.getById(boxId).subscribe({
      next: (box) => this.box.set(box),
      error: (error) => console.error('Erreur:', error)
    });
  }

  private loadLoyers(boxId: string): void {
    this.isLoading.set(true);
    this.loyerBoxService.getByBox(boxId).subscribe({
      next: (data) => {
        this.loyers.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement des loyers', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Erreur:', error);
      }
    });
  }

  protected createLoyer(): void {
    this.router.navigate(['/boxs', this.boxId(), 'loyers', 'nouveau']);
  }

  protected goBack(): void {
    this.router.navigate(['/boxs']);
  }

  protected deleteLoyer(loyer: LoyerBox): void {
    if (confirm('Voulez-vous vraiment supprimer ce loyer ?')) {
      this.loyerBoxService.delete(loyer._id!).subscribe({
        next: () => {
          this.snackBar.open('Loyer supprim\u00e9 avec succ\u00e8s', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.loadLoyers(this.boxId());
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

  protected isCurrentLoyer(index: number): boolean {
    return index === 0;
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(amount);
  }

  protected formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
