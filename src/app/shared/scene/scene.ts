import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';

interface SceneObject {
  mesh: THREE.Mesh;
  type: 'cube' | 'sphere';
}

@Component({
  selector: 'app-scene',
  templateUrl: './scene.html',
  styleUrls: ['./scene.scss'],
  standalone: true,
})
export class Scene implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef: ElementRef<HTMLCanvasElement> | null = null;

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private raycaster = new THREE.Raycaster();

  private objects: SceneObject[] = [];

  private preObjectPosition: THREE.Vector3 | null = null;
  private preObjectMesh: THREE.Mesh | null = null;
  private selectedObject: THREE.Mesh | null = null;

  private isDragging = false;
  private isMouseDown = false;
  private dragThreshold = 5;
  private dragStart = { x: 0, y: 0 };
  private yaw = 0;
  private pitch = 0;
  private cameraRadius = 15;

  private ground: THREE.Mesh | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
  ) { }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.canvasRef) {return;}

    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    this.updateCamera();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);

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

    window.addEventListener('resize', () => this.onResize(canvas));

    this.ngZone.runOutsideAngular(() => this.animate());
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

    // Check existing objects
    const intersects = this.raycaster.intersectObjects(this.objects.map((o) => o.mesh));
    if (intersects.length > 0) {
      this.selectedObject = intersects[0].object as THREE.Mesh;
      if (this.preObjectMesh && this.scene) this.scene.remove(this.preObjectMesh);
      this.preObjectMesh = null;
      this.preObjectPosition = null;
      return;
    }

    // Clicked empty space → pre-object
    const groundIntersect = this.raycaster.intersectObject(this.ground);
    if (groundIntersect.length > 0) {
      const point = groundIntersect[0].point.clone();
      point.y = 0.5;
      this.preObjectPosition = point;

      if (this.preObjectMesh && this.scene) this.scene.remove(this.preObjectMesh);
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        opacity: 0.5,
        transparent: true,
      });
      this.preObjectMesh = new THREE.Mesh(geom, material);
      this.preObjectMesh.position.copy(point);
      this.scene.add(this.preObjectMesh);

      this.selectedObject = null;
    }
  }

  public createCube() {
    this.createObject('cube');
  }

  public createSphere() {
    this.createObject('sphere');
  }

  private createObject(type: 'cube' | 'sphere') {
    if (!this.preObjectPosition || !this.scene) return;

    const geom =
      type === 'cube' ? new THREE.BoxGeometry(1, 1, 1) : new THREE.SphereGeometry(0.5, 32, 32);
    const color = type === 'cube' ? 0xff0000 : 0x0000ff;
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.copy(this.preObjectPosition);
    this.scene.add(mesh);
    this.objects.push({ mesh, type });

    if (this.preObjectMesh && this.scene) this.scene.remove(this.preObjectMesh);
    this.preObjectMesh = null;
    this.preObjectPosition = null;
  }

  public deleteObject() {
    if (!this.selectedObject || !this.scene) return;
    this.scene.remove(this.selectedObject);
    this.objects = this.objects.filter((o) => o.mesh !== this.selectedObject);
    this.selectedObject = null;
  }

  private animate = () => {
    if (!this.renderer || !this.scene || !this.camera) return;
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  private onResize(canvas: HTMLCanvasElement) {
    if (!this.camera || !this.renderer) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
