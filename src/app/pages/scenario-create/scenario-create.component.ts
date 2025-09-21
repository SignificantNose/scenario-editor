import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScenarioDesignerComponent } from '@shared/scenario-designer/scenario-designer.component';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-scenario-create',
  templateUrl: './scenario-create.component.html',
  styleUrls: ['./scenario-create.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ScenarioDesignerComponent,
    MatButtonModule,
    MatToolbarModule,
  ],
})
export class ScenarioCreateComponent {
  @ViewChild('designer') scenarioDesigner!: ScenarioDesignerComponent;

  constructor(private router: Router) {}

  cancel() {
    this.router.navigate(['/']);
  }

  create() {
    if (!this.scenarioDesigner.form.valid) {
      console.warn('Scenario designer form is invalid.');
      return;
    }

    const finalScenario = this.scenarioDesigner.getScenario();
    console.log('New scenario created:', finalScenario);
    this.router.navigate(['/']);
  }
}
