import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { PrixProduitService, PrixProduit } from '../../prix-produit.service';

export interface PrixDialogData {
  produitId: string;
  nomProduit: string;
}

@Component({
  selector: 'app-prix-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-blue-600">payments</mat-icon>
      Gestion des prix — {{ data.nomProduit }}
    </h2>

    <mat-dialog-content class="min-w-[500px]">
      <!-- Formulaire d'ajout -->
      <div class="bg-blue-50 rounded-lg p-4 mb-4">
        <h3 class="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-1">
          <mat-icon class="text-sm">add_circle</mat-icon>
          Nouveau prix
        </h3>
        <div class="flex gap-3 items-end">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Prix unitaire (Ar)</mat-label>
            <input matInput type="number" [(ngModel)]="newPrix" min="0" placeholder="Ex: 5000">
          </mat-form-field>
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Date de début</mat-label>
            <input matInput type="date" [(ngModel)]="newDateDebut">
          </mat-form-field>
          <button mat-raised-button color="primary" 
                  [disabled]="!newPrix || !newDateDebut || saving()"
                  (click)="addPrix()"
                  class="mb-5">
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>add</mat-icon>
              Ajouter
            }
          </button>
        </div>
      </div>

      <mat-divider class="mb-4"></mat-divider>

      <!-- Historique des prix -->
      <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
        <mat-icon class="text-sm">history</mat-icon>
        Historique des prix
      </h3>

      @if (loading()) {
        <div class="flex justify-center py-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (prixList().length === 0) {
        <div class="text-center py-8 text-gray-400">
          <mat-icon class="text-5xl mb-2">money_off</mat-icon>
          <p>Aucun prix défini pour ce produit</p>
        </div>
      } @else {
        <table mat-table [dataSource]="prixList()" class="w-full">
          <!-- Prix -->
          <ng-container matColumnDef="prixUnitaire">
            <th mat-header-cell *matHeaderCellDef class="font-semibold">Prix unitaire</th>
            <td mat-cell *matCellDef="let row" class="font-medium">
              {{ row.prixUnitaire | number:'1.0-0' }} Ar
            </td>
          </ng-container>

          <!-- Date début -->
          <ng-container matColumnDef="dateDebut">
            <th mat-header-cell *matHeaderCellDef class="font-semibold">Date début</th>
            <td mat-cell *matCellDef="let row">
              {{ row.dateDebut | date:'dd/MM/yyyy' }}
            </td>
          </ng-container>

          <!-- Date fin -->
          <ng-container matColumnDef="dateFin">
            <th mat-header-cell *matHeaderCellDef class="font-semibold">Date fin</th>
            <td mat-cell *matCellDef="let row">
              @if (!row.dateFin) {
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Actif
                </span>
              } @else {
                {{ row.dateFin | date:'dd/MM/yyyy' }}
              }
            </td>
          </ng-container>

          <!-- Statut -->
          <ng-container matColumnDef="statut">
            <th mat-header-cell *matHeaderCellDef class="font-semibold text-center">Statut</th>
            <td mat-cell *matCellDef="let row" class="text-center">
              @if (!row.dateFin) {
                <mat-icon class="text-green-600">check_circle</mat-icon>
              } @else {
                <mat-icon class="text-gray-400">schedule</mat-icon>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
              [class.bg-green-50]="!row.dateFin"></tr>
        </table>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }
    .mat-mdc-dialog-content {
      max-height: 70vh;
    }
    table {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    th.mat-mdc-header-cell {
      background: #f9fafb;
      color: #374151;
      font-size: 0.8rem;
    }
    tr.mat-mdc-row:hover {
      background-color: #f3f4f6;
    }
  `]
})
export class PrixDialogComponent implements OnInit {
  readonly data = inject<PrixDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PrixDialogComponent>);
  private readonly prixService = inject(PrixProduitService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly prixList = signal<PrixProduit[]>([]);

  displayedColumns = ['prixUnitaire', 'dateDebut', 'dateFin', 'statut'];

  newPrix: number | null = null;
  newDateDebut = '';

  ngOnInit(): void {
    this.loadPrix();
  }

  private loadPrix(): void {
    this.loading.set(true);
    this.prixService.getByProduit(this.data.produitId).subscribe({
      next: (prix) => {
        this.prixList.set(prix);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement des prix', 'Fermer', { duration: 3000 });
      }
    });
  }

  addPrix(): void {
    if (!this.newPrix || !this.newDateDebut) return;

    this.saving.set(true);
    this.prixService.create({
      prixUnitaire: this.newPrix,
      dateDebut: this.newDateDebut,
      produit: this.data.produitId
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Prix ajouté avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.newPrix = null;
        this.newDateDebut = '';
        this.loadPrix();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.message || 'Erreur lors de l\'ajout du prix', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
