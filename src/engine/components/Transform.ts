import { Component } from '../core/Component';
import { Vector2 } from '../core/Vector2';

export class Transform extends Component {
  public position: Vector2 = new Vector2(0, 0);
  public rotation: number = 0; // 角度
  public scale: Vector2 = new Vector2(1, 1);
  
  // 物理属性
  public velocity: Vector2 = new Vector2(0, 0);
  public angularVelocity: number = 0;

  getTypeName(): string {
    return 'Transform';
  }

  // 世界坐标（考虑父对象）
  get worldPosition(): Vector2 {
    if (!this.gameObject.parent) {
      return this.position.clone();
    }
    
    const parentTransform = this.gameObject.parent.transform;
    return parentTransform.worldPosition.add(this.position);
  }

  // 本地到世界坐标转换
  localToWorld(localPoint: Vector2): Vector2 {
    // 简化版本，不考虑旋转和缩放
    return this.worldPosition.add(localPoint);
  }

  // 世界到本地坐标转换
  worldToLocal(worldPoint: Vector2): Vector2 {
    // 简化版本，不考虑旋转和缩放
    return worldPoint.subtract(this.worldPosition);
  }

  // 朝向某个位置
  lookAt(target: Vector2): void {
    const direction = target.subtract(this.position);
    this.rotation = Math.atan2(direction.y, direction.x) * 180 / Math.PI;
  }

  // 移动
  translate(delta: Vector2): void {
    this.position = this.position.add(delta);
  }

  // 旋转
  rotate(degrees: number): void {
    this.rotation += degrees;
  }

  serialize(): any {
    return {
      position: { x: this.position.x, y: this.position.y },
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      velocity: { x: this.velocity.x, y: this.velocity.y },
      angularVelocity: this.angularVelocity
    };
  }

  deserialize(data: any): void {
    if (data.position) {
      this.position = new Vector2(data.position.x, data.position.y);
    }
    if (data.rotation !== undefined) {
      this.rotation = data.rotation;
    }
    if (data.scale) {
      this.scale = new Vector2(data.scale.x, data.scale.y);
    }
    if (data.velocity) {
      this.velocity = new Vector2(data.velocity.x, data.velocity.y);
    }
    if (data.angularVelocity !== undefined) {
      this.angularVelocity = data.angularVelocity;
    }
  }
}