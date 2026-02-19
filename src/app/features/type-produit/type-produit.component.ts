import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamicFormComponent, DynamicFormConfig, TitleComponent } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'type-produit-form',
  standalone: true,
  templateUrl: './type-produit.component.html',
  styleUrl: './type-produit.component.scss',
  imports: [DynamicFormComponent, TitleComponent, MatCardModule, MatIconModule, MatDividerModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypeProduitForm {
  protected readonly isLoading = signal(false);
  protected readonly userData = signal<Record<string, unknown> | undefined>(undefined);

  protected readonly formConfig: DynamicFormConfig = {
    mode: 'create', 
    submitLabel: 'Enregistrer',
    fields: [
      { key: 'nomTypeProduit', label: 'Type de produit', type: 'text', required: true }
    ]
  };

  onSubmit(data: Record<string, unknown>): void {
    console.log('Form submitted:', data);
  }

  onCancel(): void {
    console.log('Form cancelled');
  }

  onAddNew(): void {
    console.log('Add new type produit');
  }

  onGoBack(): void {
    console.log('Go back');
  }
}