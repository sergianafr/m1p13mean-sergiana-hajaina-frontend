import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'list-header',
  standalone: true,
  templateUrl: './list-header.component.html',
  styleUrl: './list-header.component.scss',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly actionLabel = input<string>();
  readonly actionIcon = input<string>('add');
  readonly showAction = input<boolean>(true);
  
  readonly action = output<void>();

  protected onAction(): void {
    this.action.emit();
  }
}
