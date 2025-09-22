import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScenarioDesignerComponent } from '@shared/scenario-designer/scenario-designer.component';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ScenarioData } from '@models/scenario/list-scenario-data.model';

@Component({
  selector: 'app-scenario-edit',
  templateUrl: './scenario-edit.component.html',
  styleUrls: ['./scenario-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ScenarioDesignerComponent,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
  ],
})
export class ScenarioEditComponent {
  @ViewChild('designer') scenarioDesigner: ScenarioDesignerComponent | null = null;

  exampleScenario: ScenarioData = {
    id: 1,
    name: 'aslkndf',
    createdAt: '',
    updatedAt: '',
    emitters: [
      {
        id: 1,
        position: { x: 1, y: 1, z: 1 },
      },
    ],
    listeners: [
      {
        id: 1,
        position: { x: 2, y: 3, z: 1 },
      },
    ],
  };

  constructor(private router: Router) {}

  cancel() {
    this.router.navigate(['/']);
  }

  saveChanges() {
    if (!this.scenarioDesigner || !this.scenarioDesigner.isValid) {
      console.warn('Form invalid, cannot save changes.');
      return;
    }

    const updatedScenario = this.scenarioDesigner.getScenario();
    console.log('Scenario changes saved:', updatedScenario);
    this.router.navigate(['/']);
  }
}
