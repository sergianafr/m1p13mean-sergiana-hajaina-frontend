import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MagasinService, MagasinFront, TypeMagasin } from '../../data-access/services/magasin.service';
import { TypeMagasinService } from '../../data-access/services/type-magasin.service';
import { MagasinCardComponent } from '../../components/magasin/magasin-card.component';

@Component({
  selector: 'app-magasin-list',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MagasinCardComponent
  ],
  templateUrl: './magasin-list.component.html',
  styleUrl: './magasin-list.component.scss'
})
export class MagasinListComponent implements OnInit {
  private readonly magasinService = inject(MagasinService);
  private readonly typeMagasinService = inject(TypeMagasinService);

  readonly magasins = signal<MagasinFront[]>([]);
  readonly typeMagasins = signal<TypeMagasin[]>([]);
  readonly selectedTypeId = signal<string>('all');
  readonly isLoading = signal(true);

  readonly filteredMagasins = computed(() => {
    const typeId = this.selectedTypeId();
    if (typeId === 'all') {
      return this.magasins();
    }
    return this.magasins().filter(m => m.typeMagasin?._id === typeId);
  });

  ngOnInit(): void {
    this.loadTypeMagasins();
    this.loadMagasins();
  }

  loadMagasins(): void {
    this.isLoading.set(true);
    this.magasinService.getAllMagasinsWithRatings().subscribe({
      next: (data) => {
        this.magasins.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement magasins', err);
        this.isLoading.set(false);
      }
    });
  }

  loadTypeMagasins(): void {
    this.typeMagasinService.getAllTypeMagasins().subscribe({
      next: (data) => {
        this.typeMagasins.set(data);
      },
      error: (err) => {
        console.error('Erreur chargement types magasins', err);
      }
    });
  }

  onTypeChange(typeId: string): void {
    this.selectedTypeId.set(typeId);
  }
}
