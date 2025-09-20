import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScenarioDesignerComponent } from '@shared/scenario-designer/scenario-designer.component';
import { ScenarioModel } from '@models/scenario.model';

@Component({
  selector: 'app-scenario-edit',
  templateUrl: './scenario-edit.component.html',
  styleUrls: ['./scenario-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, ScenarioDesignerComponent],
})
export class ScenarioEditComponent {
  exampleScenario: ScenarioModel = {
    id: '1',
    name: 'aslkndf',
    createdAt: '',
    emitters: [
      {
        id: '1',
        position: {
          x: 1,
          y: 1,
          z: 1,
        },
      },
    ],
    listeners: [
      {
        id: '1',
        position: {
          x: 2,
          y: 3,
          z: 1,
        },
      },
    ],
  };
  constructor(private router: Router) { }

  cancel() {
    this.router.navigate(['/']);
  }

  saveChanges() {
    console.log('Scenario changes saved');
    this.router.navigate(['/']);
  }
}
