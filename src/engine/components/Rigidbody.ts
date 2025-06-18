import { Component } from '../core/Component';
import { Vector2 } from '../core/Vector2';

export class Rigidbody extends Component {
  public mass: number = 1;
  public drag: number = 0.1;
  public angularDrag: number = 0.1;
  public gravityScale: number = 1;
  public isKinematic: boolean = false;
  
  private _velocity: Vector2 = new Vector2(0, 0);
  private _angularVelocity: number = 0;
  private _force: Vector2 = new Vector2(0, 0);
  private _torque: number = 0;

  getTypeName(): string {
    return 'Rigidbody';
  }

  get velocity(): Vector2 {
    return this._velocity.clone();
  }

  set velocity(value: Vector2) {
    this._velocity = value.clone();
  }

  get angularVelocity(): number {
    return this._angularVelocity;
  }

  set angularVelocity(value: number) {
    this._angularVelocity = value;
  }

  // 施加力
  addForce(force: Vector2): void {
    if (!this.isKinematic) {
      this._force = this._force.add(force);
    }
  }

  // 施加冲量
  addImpulse(impulse: Vector2): void {
    if (!this.isKinematic) {
      this._velocity = this._velocity.add(impulse.divide(this.mass));
    }
  }

  // 施加扭矩
  addTorque(torque: number): void {
    if (!this.isKinematic) {
      this._torque += torque;
    }
  }

  // 清除力
  clearForces(): void {
    this._force = Vector2.zero;
    this._torque = 0;
  }

  // 获取当前力
  getForce(): Vector2 {
    return this._force.clone();
  }

  getTorque(): number {
    return this._torque;
  }
}