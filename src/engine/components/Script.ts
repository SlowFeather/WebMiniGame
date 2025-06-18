import { Component } from '../core/Component';

export abstract class Script extends Component {
  // 生命周期方法
  abstract start(): void;
  abstract update(deltaTime: number): void;
  
  // 碰撞事件
  onCollisionEnter?(other: Component): void;
  onCollisionStay?(other: Component): void;
  onCollisionExit?(other: Component): void;
  
  // 触发器事件
  onTriggerEnter?(other: Component): void;
  onTriggerStay?(other: Component): void;
  onTriggerExit?(other: Component): void;
  
  // 鼠标事件
  onMouseDown?(): void;
  onMouseUp?(): void;
  onMouseEnter?(): void;
  onMouseExit?(): void;
  
  // 触摸事件
  onTouchStart?(touches: Touch[]): void;
  onTouchMove?(touches: Touch[]): void;
  onTouchEnd?(touches: Touch[]): void;
}