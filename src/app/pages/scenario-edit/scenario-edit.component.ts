import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScenarioDesignerComponent } from '@shared/scenario-designer/scenario-designer.component';

@Component({
  selector: 'app-scenario-edit',
  templateUrl: './scenario-edit.component.html',
  styleUrls: ['./scenario-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, ScenarioDesignerComponent],
})
export class ScenarioEditComponent {
  constructor(private router: Router) {}

  cancel() {
    this.router.navigate(['/']);
  }

  saveChanges() {
    console.log('Scenario changes saved');
    this.router.navigate(['/']);
  }
}
