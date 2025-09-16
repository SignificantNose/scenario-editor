import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SceneBuilder } from '../../shared/scene/scene-builder';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.html',
  styleUrls: ['./editor.scss'],
  standalone: true,
  imports: [CommonModule, SceneBuilder]
})
export class Editor {}
