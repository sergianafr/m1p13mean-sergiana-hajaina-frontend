import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MaterialModule } from '../../../../material/material.module';

@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MaterialModule],
  templateUrl: './shop-layout.component.html',
  styleUrl: './shop-layout.component.scss'
})
export class ShopLayoutComponent {

}
