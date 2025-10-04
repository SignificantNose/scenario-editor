import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  NgZone,
  Input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import * as THREE from 'three';
import { ScenarioData, EmitterData, ListenerData } from '@models/scenario/list-scenario-data.model';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ScenarioNameRegex } from 'app/const/app.defaults';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { AudioFileService } from 'core/services/audio/audio-file.service';
import { ScenarioSocketService } from 'core/services/websocket/scenario-socket.service';
import { ScenarioState, WsScenarioMessage } from '@models/websocket/scenario-socket.model';

interface SelectedObject {
  mesh: THREE.Mesh;
  selection:
  | { type: 'emitter'; data: EmitterData }
  | { type: 'listener'; data: ListenerData };
}

@Component({
  selector: 'app-scenario-designer',
  templateUrl: './scenario-designer.component.html',
  styleUrls: ['./scenario-designer.component.scss'],
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
  ],
  standalone: true,
})
export class ScenarioDesignerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef: ElementRef<HTMLCanvasElement> | null = null;

  private _scenario: ScenarioData | null = null;
  private _scenarioSubscription: Subscription | null = null;
  @Input()
  set scenario(value: ScenarioData | null) {
    if (this._scenarioSubscription) {
      this._scenarioSubscription.unsubscribe();
    }
    this._scenario = value;
    if (value) {
      this._scenarioSubscription = this.wsService.joinScenario(value.id).pipe(takeUntil(this.$destroy)).subscribe((scenario: ScenarioState) => {
        this._internalScenario = {
          id: scenario.id,
          name: scenario.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emitters: scenario.emitters,
          listeners: scenario.listeners
        };

        this.loadMeshes();
        this.patchFormFromScenario(this._internalScenario);
      });
    }
  }

  get scenario(): ScenarioData | null {
    return this._scenario;
  }

  form = new FormGroup({
    name: new FormControl<string | null>(null, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(ScenarioNameRegex)],
    }),
  });
  isValid = false;

  private $destroy = new Subject<void>();
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private raycaster = new THREE.Raycaster();
  private preObjectMesh: THREE.Mesh | null = null;
  private preObjectPosition: THREE.Vector3 | null = null;
  private isDragging = false;
  private isMouseDown = false;
  private mouseLeftCanvas = false;
  private dragThreshold = 5;
  private dragStart = { x: 0, y: 0 };
  private yaw = 0;
  private pitch = 0;
  private cameraRadius = 15;
  private ground: THREE.Mesh | null = null;

  private _internalScenario: ScenarioData = {
    id: 0,
    name: 'New Scenario',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    emitters: [],
    listeners: [],
  };
  private emitterMeshes: Map<number, THREE.Mesh> = new Map();
  private listenerMeshes: Map<number, THREE.Mesh> = new Map();
  public selectedMesh: THREE.Mesh | null = null;
  public selectedObject: SelectedObject | null = null;

  constructor(
    private ngZone: NgZone,
    private audioFileService: AudioFileService,
    private wsService: ScenarioSocketService
  ) { }

  ngOnInit() {
    this.isValid = this.form.valid;
    this.form.statusChanges.pipe(takeUntil(this.$destroy)).subscribe(() => {
      this.isValid = this.form.valid;
    });
    this.isValid = this.form.valid;

    this.form.controls.name.valueChanges
      .pipe(debounceTime(2000), distinctUntilChanged(), takeUntil(this.$destroy))
      .subscribe((name) => {
        if (this._internalScenario.id) {
          this._internalScenario.name = name || '';
          this.wsService.sendUpdate(this._internalScenario.id, 'updateName', { name });
        }
      });

    this.wsService.onUpdate().pipe(takeUntil(this.$destroy)).subscribe((update) => {
      this.handleRemoteUpdate(update);
    });
  }

  ngAfterViewInit(): void {
    if (!this.canvasRef) return;

    if (this._scenario) {
      this.patchFormFromScenario(this._scenario);
    }

    const canvas = this.canvasRef.nativeElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    this.updateCamera();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const gridHelper = new THREE.GridHelper(100, 100, 0x999999, 0xcccccc);
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
    this.ground = new THREE.Mesh(planeGeometry, planeMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);
    this.scene.add(gridHelper);

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e), { passive: false });
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: false });
    window.addEventListener('mouseup', (e) => this.onMouseUp(e), { passive: false });
    canvas.addEventListener('mouseleave', (e) => this.onMouseLeave(e), { passive: false });
    canvas.addEventListener('mouseenter', (e) => this.onMouseEnter(e), { passive: false });
    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    window.addEventListener('resize', () => this.onResize());
    this.ngZone.runOutsideAngular(() => this.animate());
    this.isValid = this.form.valid;
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
    window.removeEventListener('mouseup', (e) => this.onMouseUp(e));
    window.removeEventListener('resize', () => this.onResize());
    if (this._internalScenario.id) {
      this.wsService.disconnect();
    }

  }

  public getScenario(): ScenarioData {
    this._internalScenario.name = this.form.controls.name.value || '';
    return { ...this._internalScenario };
  }

  private loadMeshes() {
    if (!this.scene) return;

    this.emitterMeshes.forEach((mesh) => this.scene?.remove(mesh));
    this.listenerMeshes.forEach((mesh) => this.scene?.remove(mesh));
    this.emitterMeshes.clear();
    this.listenerMeshes.clear();

    this._internalScenario.emitters.forEach((e) => this.addEmitterFromRemote(e));
    this._internalScenario.listeners.forEach((l) => this.addListenerFromRemote(l));
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
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  private onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.isMouseDown = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent) {
    event.preventDefault();
    if (!this.isMouseDown || this.mouseLeftCanvas || !this.camera) return;

    const deltaX = event.clientX - this.dragStart.x;
    const deltaY = event.clientY - this.dragStart.y;

    if (!this.isDragging && (Math.abs(deltaX) > this.dragThreshold || Math.abs(deltaY) > this.dragThreshold)) {
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
    if (event) event.preventDefault();
    if (!this.isDragging && this.isMouseDown && !this.mouseLeftCanvas && event) {
      const clickedOnObject = this.handleObjectSelection(event);
      if (!clickedOnObject) this.handleGroundClick(event);
    }
    this.isMouseDown = false;
    this.isDragging = false;
    this.mouseLeftCanvas = false;
  }

  private onMouseLeave(event: MouseEvent) {
    if (this.isMouseDown) this.mouseLeftCanvas = true;
  }

  private onMouseEnter(event: MouseEvent) {
    this.mouseLeftCanvas = false;
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault();
    this.cameraRadius += event.deltaY * 0.05;
    this.cameraRadius = Math.max(5, Math.min(100, this.cameraRadius));
    this.updateCamera();
  }

  private handleObjectSelection(event: MouseEvent): boolean {
    if (!this.camera || !this.scene) return false;

    const normalizedMouse = this.getNormalizedMouse(event);
    this.raycaster.setFromCamera(normalizedMouse, this.camera);

    const allMeshes = [...this.emitterMeshes.values(), ...this.listenerMeshes.values()];
    const intersects = this.raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      if (this.selectedMesh && this.selectedMesh !== mesh) {
        const type = this.selectedMesh.userData['type'];
        const color = type === 'emitter' ? 0xff0000 : 0x0000ff;
        (this.selectedMesh.material as THREE.MeshBasicMaterial).color.set(color);
      }
      this.selectedMesh = mesh;
      const type = mesh.userData['type'];
      const brightColor = type === 'emitter' ? 0xff6666 : 0x6666ff;
      (mesh.material as THREE.MeshBasicMaterial).color.set(brightColor);
      const id = mesh.userData['id'];
      const data: EmitterData | ListenerData =
        type === 'emitter'
          ? this._internalScenario.emitters.find((e) => e.id === id)!
          : this._internalScenario.listeners.find((l) => l.id === id)!;
      this.selectedObject = { mesh, selection: { type, data } };
      return true;
    } else {
      this.clearSelectedObject();
      return false;
    }
  }

  private clearSelectedObject() {
    if (this.selectedMesh) {
      const type = this.selectedMesh.userData['type'];
      const color = type === 'emitter' ? 0xff0000 : 0x0000ff;
      (this.selectedMesh.material as THREE.MeshBasicMaterial).color.set(color);
    }
    this.selectedMesh = null;
    this.selectedObject = null;
  }

  private handleGroundClick(event: MouseEvent) {
    if (!this.camera || !this.scene || !this.ground) return;

    const normalizedMouse = this.getNormalizedMouse(event);
    this.raycaster.setFromCamera(normalizedMouse, this.camera);
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
    }
  }

  private handleRemoteUpdate(update: WsScenarioMessage) {
    const { action, payload } = update;
    switch (action) {
      case 'addEmitter': this.addEmitterFromRemote(payload); break;
      case 'deleteEmitter': this.deleteEmitterFromRemote(payload.id); break;
      case 'updateAudioFileUri':
        const e = this._internalScenario.emitters.find(em => em.id === payload.id);
        if (e) e.audioFileUri = payload.audioFileUri;
        break;
      case 'addListener': this.addListenerFromRemote(payload); break;
      case 'deleteListener': this.deleteListenerFromRemote(payload.id); break;
      case 'updateName':
        if (payload?.name && payload.name !== this.form.controls.name.value) {
          this.form.patchValue({ name: payload.name }, { emitEvent: false });
          this._internalScenario.name = payload.name;
        }
        break;
    }
  }

  public addEmitter() {
    if (!this.preObjectPosition || !this.scene) return;
    const id = Date.now() % 1e9;
    const emitter: EmitterData = { id, position: { ...this.preObjectPosition }, audioFileUri: null };
    this._internalScenario.emitters.push(emitter);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    mesh.position.copy(this.preObjectPosition);
    mesh.userData = { id, type: 'emitter' };
    this.scene.add(mesh);
    this.emitterMeshes.set(id, mesh);
    if (this.preObjectMesh) this.scene.remove(this.preObjectMesh);
    this.preObjectMesh = null;
    this.preObjectPosition = null;
    if (this._internalScenario.id) this.wsService.sendUpdate(this._internalScenario.id, 'addEmitter', emitter);
  }

  private addEmitterFromRemote(emitter: EmitterData) {
    if (!this.scene) return;
    this._internalScenario.emitters.push(emitter);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    mesh.position.set(emitter.position.x, emitter.position.y, emitter.position.z);
    mesh.userData = { id: emitter.id, type: 'emitter' };
    this.scene.add(mesh);
    this.emitterMeshes.set(emitter.id, mesh);
  }

  public onAudioSelected(event: Event, emitter: EmitterData) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('audio/')) { alert('Please select an audio file'); return; }

    this.audioFileService.uploadAudio(file).subscribe({
      next: (result) => {
        emitter.audioFileUri = result.uri;
        if (this._internalScenario.id) this.wsService.sendUpdate(this._internalScenario.id, 'updateAudioFileUri', { id: emitter.id, audioFileUri: result.uri });
      },
      error: (err) => { console.error('Upload failed', err); alert('File upload failed'); },
    });
  }

  public addListener() {
    if (!this.preObjectPosition || !this.scene) return;
    const id = Date.now() % 1e9;
    const listener: ListenerData = { id, position: { ...this.preObjectPosition } };
    this._internalScenario.listeners.push(listener);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    mesh.position.copy(this.preObjectPosition);
    mesh.userData = { id, type: 'listener' };
    this.scene.add(mesh);
    this.listenerMeshes.set(id, mesh);
    if (this.preObjectMesh) this.scene.remove(this.preObjectMesh);
    this.preObjectMesh = null;
    this.preObjectPosition = null;
    if (this._internalScenario.id) this.wsService.sendUpdate(this._internalScenario.id, 'addListener',
      listener
    );
  }

  private addListenerFromRemote(listener: ListenerData) {
    if (!this.scene) return;
    this._internalScenario.listeners.push(listener);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    mesh.position.set(listener.position.x, listener.position.y, listener.position.z);
    mesh.userData = { id: listener.id, type: 'listener' };
    this.scene.add(mesh);
    this.listenerMeshes.set(listener.id, mesh);
  }


  public deleteSelected() {
    if (!this.selectedObject || !this.scene) return;
    const { mesh, selection } = this.selectedObject;
    const { type, data } = selection;

    if (type === 'emitter') {
      this.scene.remove(mesh);
      this.emitterMeshes.delete(data.id);
      this._internalScenario.emitters = this._internalScenario.emitters.filter((e) => e.id !== data.id);
      if (this._internalScenario.id) this.wsService.sendUpdate(this._internalScenario.id, 'deleteEmitter', { id: data.id });
    } else {
      this.scene.remove(mesh);
      this.listenerMeshes.delete(data.id);
      this._internalScenario.listeners = this._internalScenario.listeners.filter((l) => l.id !== data.id);
      if (this._internalScenario.id) this.wsService.sendUpdate(this._internalScenario.id, 'deleteListener', { id: data.id });
    }
    this.clearSelectedObject();
  }

  private deleteEmitterFromRemote(id: number) {
    const mesh = this.emitterMeshes.get(id);
    if (mesh && this.scene) this.scene.remove(mesh);
    this.emitterMeshes.delete(id);
    this._internalScenario.emitters = this._internalScenario.emitters.filter(e => e.id !== id);
  }

  private deleteListenerFromRemote(id: number) {
    const mesh = this.listenerMeshes.get(id);
    if (mesh && this.scene) this.scene.remove(mesh);
    this.listenerMeshes.delete(id);
    this._internalScenario.listeners = this._internalScenario.listeners.filter(l => l.id !== id);
  }

  private animate = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.canvasRef) return;
    requestAnimationFrame(this.animate);
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) this.onResize();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize() {
    if (!this.camera || !this.renderer || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }
  private patchFormFromScenario(scenario: ScenarioData) {
    this.form.patchValue({ name: this._internalScenario.name }, { emitEvent: false });
  }

}
