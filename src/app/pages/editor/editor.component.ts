import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SceneBuilderComponent } from '../../shared/scene/scene-builder.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  standalone: true,
  imports: [CommonModule, SceneBuilderComponent]
})
export class EditorComponent {}
