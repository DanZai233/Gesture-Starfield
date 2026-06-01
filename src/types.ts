export interface HandState {
  x: number; // 0 to 1
  y: number; // 0 to 1
  pinchDistance: number; // 0 to 1ish
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number; // For depth/parallax
  baseSize: number;
}
