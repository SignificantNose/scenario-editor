import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Scenario {
  id: string;
  name: string;
  createdAt: string;
}

@Component({
  selector: 'app-scenario-list',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss'],
})
export class ScenarioListComponent implements OnInit {
  scenarios: Scenario[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    // later you’ll fetch from API/DB
    this.scenarios = [
      { id: '1', name: 'Scenario One', createdAt: '2025-09-17' },
      { id: '2', name: 'Scenario Two', createdAt: '2025-09-16' },
    ];
  }

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
