import { Component } from '@angular/core';
import { ScenarioListComponent } from '../scenario-list/scenario-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ScenarioListComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
