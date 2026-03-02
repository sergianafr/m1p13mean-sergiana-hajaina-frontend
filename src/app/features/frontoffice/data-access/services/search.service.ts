import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  readonly searchTerm = signal<string>('');
  readonly selectedTypeId = signal<string | null>(null);

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  setSelectedType(typeId: string | null): void {
    this.selectedTypeId.set(typeId);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedTypeId.set(null);
  }
}
