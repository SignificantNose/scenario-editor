import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Scene } from '../../shared/scene/scene';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.html',
  styleUrls: ['./editor.scss'],
  standalone: true,
  imports: [CommonModule, Scene]
})
export class Editor {}
