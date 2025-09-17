import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Scenario {
  id: string;
  name: string;
  createdAt: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  scenarios: Scenario[] = [
    { id: '1', name: 'Scenario One', createdAt: '2025-09-17' },
    { id: '2', name: 'Scenario Two', createdAt: '2025-09-16' },
  ];

  constructor(private router: Router) {}

  createScenario() {
    this.router.navigate(['/editor/new']);
  }

  editScenario(id: string) {
    this.router.navigate([`/editor/${id}`]);
  }

  deleteScenario(id: string) {
    this.scenarios = this.scenarios.filter((s) => s.id !== id);
  }
}
