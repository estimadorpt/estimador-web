/**
 * The map camera. The SVG is drawn at its real pixel size (text inside it is
 * real 11px+), and the camera says which point of the map plane sits at the
 * centre and how many pixels one map unit takes.
 */
import type { Bounds, Point } from './geometry';

export interface Viewport {
  width: number;
  height: number;
}

export interface Camera {
  x: number;
  y: number;
  /** Pixels per map unit. */
  k: number;
}

/** Frame `bounds` inside the viewport with `padding` px left on every side. */
export function fitCamera(bounds: Bounds, viewport: Viewport, padding = 24): Camera {
  const [[x0, y0], [x1, y1]] = bounds;
  const width = Math.max(x1 - x0, 1e-6);
  const height = Math.max(y1 - y0, 1e-6);
  const room = (size: number) => Math.max(size - 2 * padding, size * 0.5, 1);
  const k = Math.min(room(viewport.width) / width, room(viewport.height) / height);
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, k };
}

/** The SVG transform that puts the camera's point at the viewport centre. */
export function cameraTransform(camera: Camera, viewport: Viewport): string {
  const tx = viewport.width / 2 - camera.x * camera.k;
  const ty = viewport.height / 2 - camera.y * camera.k;
  return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${camera.k.toPrecision(6)})`;
}

/** Map plane → screen pixels. */
export function toScreen(point: Point, camera: Camera, viewport: Viewport): Point {
  return [viewport.width / 2 + (point[0] - camera.x) * camera.k, viewport.height / 2 + (point[1] - camera.y) * camera.k];
}

/** Screen pixels → map plane. */
export function toPlane(point: Point, camera: Camera, viewport: Viewport): Point {
  return [camera.x + (point[0] - viewport.width / 2) / camera.k, camera.y + (point[1] - viewport.height / 2) / camera.k];
}

/** d3.interpolateZoom's view: centre and visible width in map units. */
export function toZoomView(camera: Camera, viewport: Viewport): [number, number, number] {
  return [camera.x, camera.y, viewport.width / camera.k];
}

export function fromZoomView([x, y, width]: [number, number, number] | number[], viewport: Viewport): Camera {
  return { x, y, k: viewport.width / width };
}

/** Flights between neighbours are quick, country-to-parish ones readable; always 300–900 ms. */
export function flightDuration(from: Camera, to: Camera, viewport: Viewport): number {
  const zoom = Math.abs(Math.log(to.k / from.k));
  const pan = Math.hypot(to.x - from.x, to.y - from.y) * Math.min(from.k, to.k) / Math.max(viewport.width, viewport.height, 1);
  return Math.round(Math.min(900, Math.max(300, 320 + zoom * 120 + Math.min(pan, 2) * 120)));
}

/** Zoom by `factor` keeping `anchor` (screen px, default the centre) where it is. */
export function zoomCamera(camera: Camera, factor: number, viewport: Viewport, anchor?: Point): Camera {
  const at = anchor ?? [viewport.width / 2, viewport.height / 2];
  const fixed = toPlane(at, camera, viewport);
  const k = camera.k * factor;
  return { x: fixed[0] - (at[0] - viewport.width / 2) / k, y: fixed[1] - (at[1] - viewport.height / 2) / k, k };
}

/** Keep a manual zoom between the level's framing and `max` times closer. */
export function clampZoom(camera: Camera, fit: Camera, max = 10): Camera {
  return { ...camera, k: Math.min(fit.k * max, Math.max(fit.k, camera.k)) };
}

export function sameCamera(a: Camera | null, b: Camera | null): boolean {
  if (!a || !b) return a === b;
  const scale = Math.max(a.k, b.k);
  return Math.abs(a.k - b.k) / scale < 1e-4 && Math.hypot(a.x - b.x, a.y - b.y) * scale < 0.5;
}

/** Smooth start and stop for a flight. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
