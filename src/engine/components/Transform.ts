// engine/components/Transform.ts
import { Component } from '../core/Component';
import { Vector2 } from '../core/Vector2';

export class Transform extends Component {
  public position: Vector2 = new Vector2(0, 0);
  public rotation: number = 0; // 角度
  public scale: Vector2 = new Vector2(1, 1);
  
  // 物理属性
  public velocity: Vector2 = new Vector2(0, 0);
  public angularVelocity: number = 0; // 角速度（度/秒）
  
  // 阻尼系数（0-1，0表示无阻尼，1表示完全停止）
  public linearDamping: number = 0.1;
  public angularDamping: number = 0.1;
  
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
  // 便捷方法
  // 移动
  translate(x: number, y: number): void {
    this.position.x += x;
    this.position.y += y;
  }
  // 旋转
  rotate(degrees: number): void {
    this.rotation += degrees;
  }
  
  // 设置位置
  setPosition(x: number, y: number): void {
    this.position.set(x, y);
  }
  
  // 获取前方向向量（基于旋转）
  getForward(): Vector2 {
    const rad = this.rotation * Math.PI / 180;
    return new Vector2(Math.cos(rad), Math.sin(rad));
  }
  
  // 获取右方向向量
  getRight(): Vector2 {
    const rad = (this.rotation + 90) * Math.PI / 180;
    return new Vector2(Math.cos(rad), Math.sin(rad));
  }
  
  // 序列化
  serialize(): any {
    return {
      position: { x: this.position.x, y: this.position.y },
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      velocity: { x: this.velocity.x, y: this.velocity.y },
      angularVelocity: this.angularVelocity,
      linearDamping: this.linearDamping,
      angularDamping: this.angularDamping
    };
  }
  
  // 反序列化
  deserialize(data: any): void {
    if (data.position) {
      this.position.set(data.position.x || 0, data.position.y || 0);
    }
    if (data.rotation !== undefined) {
      this.rotation = data.rotation;
    }
    if (data.scale) {
      this.scale.set(data.scale.x || 1, data.scale.y || 1);
    }
    if (data.velocity) {
      this.velocity.set(data.velocity.x || 0, data.velocity.y || 0);
    }
    if (data.angularVelocity !== undefined) {
      this.angularVelocity = data.angularVelocity;
    }
    if (data.linearDamping !== undefined) {
      this.linearDamping = data.linearDamping;
    }
    if (data.angularDamping !== undefined) {
      this.angularDamping = data.angularDamping;
    }
  }
  
  // 克隆
  clone(): Transform {
    const cloned = new Transform();
    cloned.position = this.position.clone();
    cloned.rotation = this.rotation;
    cloned.scale = this.scale.clone();
    cloned.velocity = this.velocity.clone();
    cloned.angularVelocity = this.angularVelocity;
    cloned.linearDamping = this.linearDamping;
    cloned.angularDamping = this.angularDamping;
    return cloned;
  }
}