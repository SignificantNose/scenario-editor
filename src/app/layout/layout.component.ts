import { Component } from "@angular/core";
import { HeaderComponent } from "./components/header/header.component";
import { RouterModule, RouterOutlet } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  imports: [CommonModule, RouterModule, HeaderComponent, RouterOutlet],
})
export class LayoutComponent {
}
