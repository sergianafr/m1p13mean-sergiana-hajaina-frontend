import { Component, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-fo-goback-button',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './fo-goback-button.component.html',
  styleUrl: './fo-goback-button.component.scss'
})
export class FoGobackButtonComponent {
  readonly clicked = output<void>();

  goBack(): void {
    this.clicked.emit();
  }
}
