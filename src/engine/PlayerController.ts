/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { hardwareAudio } from '../audio/HardwareAudio';

const _forward = new THREE.Vector3();
const _side = new THREE.Vector3();
const _moveDir = new THREE.Vector3();

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3 = new THREE.Vector3(0, 3.2, 25);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Rotation pitch (vertical) and yaw (horizontal)
  public pitch = 0;
  public yaw = 0;

  // Key states
  public keys: { [key: string]: boolean } = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    Space: false,
    ShiftLeft: false,
  };

  public isGrounded = true;
  private stepTimer = 0;
  public lookSensitivity = 0.0025;
  public isLocked = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';
  }

  public handleKeyDown(e: KeyboardEvent) {
    if (this.keys[e.code] !== undefined) {
      this.keys[e.code] = true;
    }
  }

  public handleKeyUp(e: KeyboardEvent) {
    if (this.keys[e.code] !== undefined) {
      this.keys[e.code] = false;
    }
  }

  public handleMouseMove(movementX: number, movementY: number) {
    this.yaw -= movementX * this.lookSensitivity;
    this.pitch -= movementY * this.lookSensitivity;

    // Clamp pitch between -85 and +85 degrees
    const maxPitch = (Math.PI / 2) - 0.08;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public update(delta: number, isLaserActive: boolean, zoneYFloor: number = 0) {
    // Determine movement direction from camera yaw
    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    _side.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
    _moveDir.set(0, 0, 0);

    const isW = this.keys.KeyW || this.keys.ArrowUp;
    const isS = this.keys.KeyS || this.keys.ArrowDown;
    const isA = this.keys.KeyA || this.keys.ArrowLeft;
    const isD = this.keys.KeyD || this.keys.ArrowRight;

    if (isW) _moveDir.add(_forward);
    if (isS) _moveDir.sub(_forward);
    if (isD) _moveDir.add(_side);
    if (isA) _moveDir.sub(_side);

    const moveSpeed = this.keys.ShiftLeft ? 18.0 : 10.0;

    if (_moveDir.lengthSq() > 0) {
      _moveDir.normalize();
      this.velocity.x = _moveDir.x * moveSpeed;
      this.velocity.z = _moveDir.z * moveSpeed;

      // Footstep audio
      if (this.isGrounded) {
        this.stepTimer += delta * (this.keys.ShiftLeft ? 1.5 : 1.0);
        if (this.stepTimer > 0.45) {
          this.stepTimer = 0;
          hardwareAudio.playStepSound();
        }
      }
    } else {
      // Damping
      this.velocity.x *= 0.75;
      this.velocity.z *= 0.75;
    }

    // Jump
    if (this.keys.Space && this.isGrounded) {
      this.velocity.y = 8.5;
      this.isGrounded = false;
      hardwareAudio.playStepSound();
    }

    // Gravity
    this.velocity.y -= 22.0 * delta;

    // Integrate
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // Floor collision
    const eyeHeight = 3.2;
    if (this.position.y < zoneYFloor + eyeHeight) {
      this.position.y = zoneYFloor + eyeHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Laser barrier collision (z = -42, between -18 and +18)
    if (isLaserActive) {
      if (this.position.z < -40 && this.position.z > -44 && Math.abs(this.position.x) < 18) {
        this.position.z = -40; // Push back from barrier
      }
    }

    // World boundary limits
    this.position.x = Math.max(-65, Math.min(65, this.position.x));
    this.position.z = Math.max(-65, Math.min(65, this.position.z));

    // Update camera transform
    this.camera.position.copy(this.position);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  public resetPosition(x = 0, y = 3.2, z = 25, yaw = 0) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = 0;
    this.camera.position.copy(this.position);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
