import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-title',
  standalone: true,
  templateUrl: './title.component.html',
  styleUrl: './title.component.scss',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TitleComponent {
  readonly textHead = input.required<string>();
  readonly formTitle = input.required<string>();
  readonly showBackButton = input<boolean>(true);
  
  readonly redirect = output<void>();

  protected onRedirect(): void {
    this.redirect.emit();
  }
}
