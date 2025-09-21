import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  NgZone,
  Input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { ScenarioModel } from '@models/scenario.model';
import { EmitterEntity } from '@models/emitter.model';
import { ListenerEntity } from '@models/listener.model';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ScenarioNameRegex } from '@core/const/app.defaults';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-scenario-designer',
  templateUrl: './scenario-designer.component.html',
  styleUrls: ['./scenario-designer.component.scss'],
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, FormsModule, MatButtonModule],
  standalone: true,
})
export class ScenarioDesignerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef: ElementRef<HTMLCanvasElement> | null = null;

  @Input() scenario: ScenarioModel | null = null;

  form = new FormGroup({
    name: new FormControl<string | null>(null, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(ScenarioNameRegex)],
    }),
  });
  isValid = false;

  private $destroy = new Subject();

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private raycaster = new THREE.Raycaster();

  private preObjectMesh: THREE.Mesh | null = null;
  private selectedMesh: THREE.Mesh | null = null;
  private preObjectPosition: THREE.Vector3 | null = null;

  private isDragging = false;
  private isMouseDown = false;
  private dragThreshold = 5;
  private dragStart = { x: 0, y: 0 };
  private yaw = 0;
  private pitch = 0;
  private cameraRadius = 15;
  private ground: THREE.Mesh | null = null;

  private _internalScenario: ScenarioModel = {
    name: 'New Scenario',
    emitters: [],
    listeners: [],
  };

  private nextId = 1;
  private emitterMeshes: Map<string, THREE.Mesh> = new Map();
  private listenerMeshes: Map<string, THREE.Mesh> = new Map();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
  ) {}

  ngOnInit(){
    // todo: error on detection change happens here,
    // despite it being the onInit hook
    if (this.scenario) {
      this.loadScenario();
      this.form.patchValue({ name: this.scenario.name });
    } else {
      this.form.patchValue({ name: this._internalScenario.name });
    }

    this.isValid = this.form.valid;
    this.form.statusChanges.pipe(takeUntil(this.$destroy)).subscribe(() => {
      this.isValid = this.form.valid;
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    this.updateCamera();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene.add(new THREE.GridHelper(100, 100));

    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
    this.ground = new THREE.Mesh(planeGeometry, planeMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e), { passive: false });
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: false });
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e), { passive: false });
    canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e), { passive: false });
    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    canvas.addEventListener('click', (e) => this.onClick(e));
    window.addEventListener('resize', () => this.onResize());

    this.ngZone.runOutsideAngular(() => this.animate());
  }

  ngOnDestroy(): void {
    this.$destroy.next(true);
    this.$destroy.complete();
  }

  public getScenario(): ScenarioModel {
    this._internalScenario.name = this.form.controls.name.value || '';
    return { ...this._internalScenario };
  }

  private loadScenario() {
    if (!this.scene || !this.scenario) return;

    this.emitterMeshes.forEach((mesh) => this.scene?.remove(mesh));
    this.listenerMeshes.forEach((mesh) => this.scene?.remove(mesh));
    this.emitterMeshes.clear();
    this.listenerMeshes.clear();

    this.scenario.emitters.forEach((e) => {
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(e.position.x, e.position.y, e.position.z);
      this.scene?.add(mesh);
      this.emitterMeshes.set(e.id, mesh);
    });

    this.scenario.listeners.forEach((l) => {
      const geom = new THREE.SphereGeometry(0.5, 32, 32);
      const mat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(l.position.x, l.position.y, l.position.z);
      this.scene?.add(mesh);
      this.listenerMeshes.set(l.id, mesh);
    });

    this._internalScenario = { ...this.scenario };
  }

  private updateCamera() {
    if (!this.camera) return;
    this.camera.position.x = this.cameraRadius * Math.sin(this.yaw) * Math.cos(this.pitch);
    this.camera.position.y = this.cameraRadius * Math.sin(this.pitch);
    this.camera.position.z = this.cameraRadius * Math.cos(this.yaw) * Math.cos(this.pitch);
    this.camera.lookAt(0, 0, 0);
  }

  private getNormalizedMouse(event: MouseEvent) {
    if (!this.canvasRef) return new THREE.Vector2(0, 0);
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  private onMouseDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    this.isMouseDown = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isMouseDown || !this.camera) return;

    const deltaX = event.clientX - this.dragStart.x;
    const deltaY = event.clientY - this.dragStart.y;

    if (
      !this.isDragging &&
      (Math.abs(deltaX) > this.dragThreshold || Math.abs(deltaY) > this.dragThreshold)
    ) {
      this.isDragging = true;
    }

    if (this.isDragging) {
      this.yaw += deltaX * 0.005;
      this.pitch += deltaY * 0.005;
      this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
      this.updateCamera();
      this.dragStart = { x: event.clientX, y: event.clientY };
    }
  }

  private onMouseUp(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isMouseDown = false;
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.cameraRadius += event.deltaY * 0.05;
    this.cameraRadius = Math.max(5, Math.min(100, this.cameraRadius));
    this.updateCamera();
  }

  private onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.isDragging) return;
    if (!this.camera || !this.scene || !this.ground) return;

    const normalizedMouse = this.getNormalizedMouse(event);
    this.raycaster.setFromCamera(normalizedMouse, this.camera);

    const allMeshes = [...this.emitterMeshes.values(), ...this.listenerMeshes.values()];
    const intersects = this.raycaster.intersectObjects(allMeshes);
    if (intersects.length > 0) {
      this.selectedMesh = intersects[0].object as THREE.Mesh;
      if (this.preObjectMesh && this.scene) this.scene.remove(this.preObjectMesh);
      this.preObjectMesh = null;
      this.preObjectPosition = null;
      return;
    }

    const groundIntersect = this.raycaster.intersectObject(this.ground);
    if (groundIntersect.length > 0) {
      const point = groundIntersect[0].point.clone();
      point.y = 0.5;
      this.preObjectPosition = point;

      if (this.preObjectMesh && this.scene) this.scene.remove(this.preObjectMesh);
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
      this.preObjectMesh = new THREE.Mesh(geom, mat);
      this.preObjectMesh.position.copy(point);
      this.scene.add(this.preObjectMesh);

      this.selectedMesh = null;
    }
  }

  public addEmitter() {
    if (!this.preObjectPosition || !this.scene) return;
    const id = this.generateId();
    const emitter: EmitterEntity = { id, position: { ...this.preObjectPosition } };
    this._internalScenario.emitters.push(emitter);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.preObjectPosition);
    this.scene.add(mesh);
    this.emitterMeshes.set(id, mesh);

    if (this.preObjectMesh) this.scene.remove(this.preObjectMesh);
    this.preObjectMesh = null;
    this.preObjectPosition = null;
  }

  public addListener() {
    if (!this.preObjectPosition || !this.scene) return;
    const id = this.generateId();
    const listener: ListenerEntity = { id, position: { ...this.preObjectPosition } };
    this._internalScenario.listeners.push(listener);

    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.preObjectPosition);
    this.scene.add(mesh);
    this.listenerMeshes.set(id, mesh);


    if (this.preObjectMesh) this.scene.remove(this.preObjectMesh);
    this.preObjectMesh = null;
    this.preObjectPosition = null;
  }

  public deleteSelected() {
    if (!this.selectedMesh || !this.scene) return;

    for (const [id, mesh] of this.emitterMeshes) {
      if (mesh === this.selectedMesh) {
        this.scene.remove(mesh);
        this.emitterMeshes.delete(id);
        this._internalScenario.emitters = this._internalScenario.emitters.filter((e) => e.id !== id);
        this.selectedMesh = null;
        return;
      }
    }

    for (const [id, mesh] of this.listenerMeshes) {
      if (mesh === this.selectedMesh) {
        this.scene.remove(mesh);
        this.listenerMeshes.delete(id);
        this._internalScenario.listeners = this._internalScenario.listeners.filter(
          (l) => l.id !== id,
        );
        this.selectedMesh = null;
        return;
      }
    }
  }

  private animate = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.canvasRef) return;
    requestAnimationFrame(this.animate);

    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      this.onResize();
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onResize() {
    if (!this.camera || !this.renderer || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private generateId(): string {
    return (this.nextId++).toString();
  }
}
