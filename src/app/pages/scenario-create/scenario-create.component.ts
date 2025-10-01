import { Component, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScenarioDesignerComponent } from '@shared/scenario-designer/scenario-designer.component';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ScenarioService } from 'core/services/scenario/scenario.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-scenario-create',
  templateUrl: './scenario-create.component.html',
  styleUrls: ['./scenario-create.component.scss'],
  standalone: true,
  imports: [CommonModule, ScenarioDesignerComponent, MatButtonModule, MatToolbarModule],
})
export class ScenarioCreateComponent implements OnDestroy {
  @ViewChild('designer') scenarioDesigner: ScenarioDesignerComponent | null = null;
  private $destroy = new Subject<void>();

  constructor(
    private router: Router,
    private scenarioService: ScenarioService,
  ) { }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  cancel() {
    this.router.navigate(['/']);
  }

  create() {
    if (!this.scenarioDesigner || !this.scenarioDesigner.form.valid) {
      console.warn('Scenario designer form is invalid.');
      return;
    }

    const finalScenario = this.scenarioDesigner.getScenario();
    this.scenarioService
      .create(finalScenario)
      .pipe(takeUntil(this.$destroy))
      .subscribe({
        next: () => {
          console.log('Scenario saved!');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error saving scenario:', err);
        },
      });
  }
}
