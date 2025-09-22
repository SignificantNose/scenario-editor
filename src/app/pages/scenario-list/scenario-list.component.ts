import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ScenarioService } from '@services/scenario.service';
import { ScenarioData } from '@models/scenario/list-scenario-data.model';

@Component({
  selector: 'app-scenario-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss'],
})
export class ScenarioListComponent {
  private router = inject(Router);
  private api = inject(ScenarioService);

  scenarios: ScenarioData[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.fetch();
  }

  private fetch() {
    this.loading = true;
    this.api.list().subscribe({
      next: (rows) => {
        this.scenarios = rows;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Failed to load scenarios';
        this.loading = false;
      },
    });
  }

  createScenario() {
    this.router.navigate(['/editor/new']);
  }

  editScenario(id: number) {
    this.router.navigate([`/editor/${id}`]);
  }

  deleteScenario(id: number) {
    this.api.delete({ id }).subscribe({
      next: () => {
        this.scenarios = this.scenarios.filter((s) => s.id !== id);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Failed to delete scenario';
      },
    });
  }
}
