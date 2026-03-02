import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './shop-layout.component.html',
  styleUrl: './shop-layout.component.scss'
})
export class ShopLayoutComponent {

}
