import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';
import { Rigidbody } from '../components/Rigidbody';
import { Transform } from '../components/Transform';
import { Collider } from '../components/Collider';
import { Script } from '../components/Script'; // 添加Script导入
import { Engine } from '../core/Engine';
import { Vector2 } from '../core/Vector2';

export class PhysicsSystem extends ComponentSystem {
  getComponentTypes(): string[] {
    return ['PhysicsSystem'];
  }
  public gravity: Vector2 = new Vector2(0, 980); // 像素/秒²
  private collisionPairs: Map<string, boolean> = new Map();

  update(deltaTime: number, components: Component[]): void {
    const rigidbodies = components as Rigidbody[];
    
    // 物理更新
    for (const rb of rigidbodies) {
      if (!rb.enabled || rb.isKinematic) continue;
      
      const transform = rb.gameObject.transform;
      
      // 应用重力
      const gravityForce = this.gravity.multiply(rb.mass * rb.gravityScale);
      rb.addForce(gravityForce);
      
      // 计算加速度
      const force = rb.getForce();
      const acceleration = force.divide(rb.mass);
      
      // 更新速度
      rb.velocity = rb.velocity.add(acceleration.multiply(deltaTime));
      
      // 应用阻力
      rb.velocity = rb.velocity.multiply(1 - rb.drag * deltaTime);
      
      // 更新位置
      transform.velocity = rb.velocity;
      
      // 角速度
      const angularAcceleration = rb.getTorque() / rb.mass;
      rb.angularVelocity += angularAcceleration * deltaTime;
      rb.angularVelocity *= (1 - rb.angularDrag * deltaTime);
      transform.angularVelocity = rb.angularVelocity;
      
      // 清除力
      rb.clearForces();
    }
    
    // 碰撞检测
    this.checkCollisions();
  }

  private checkCollisions(): void {
    const gameObjects = Engine.instance.getAllGameObjects();
    const colliders: Array<{ gameObject: any, collider: Collider }> = [];
    
    // 收集所有碰撞器 - 修复类型错误
    for (const go of gameObjects) {
      // 使用getAllComponents然后过滤，避免传递抽象类构造函数
      const allComponents = go.getAllComponents();
      const collider = allComponents.find((component): component is Collider => 
        component instanceof Collider
      );
      
      if (collider && collider.enabled) {
        colliders.push({ gameObject: go, collider });
      }
    }
    
    // 新的碰撞对
    const newCollisionPairs = new Map<string, boolean>();
    
    // 检测碰撞
    for (let i = 0; i < colliders.length; i++) {
      for (let j = i + 1; j < colliders.length; j++) {
        const a = colliders[i];
        const b = colliders[j];
        
        if (a.collider.checkCollision(b.collider)) {
          const pairKey = `${a.gameObject.id}_${b.gameObject.id}`;
          newCollisionPairs.set(pairKey, true);
          
          // 触发碰撞事件
          if (!this.collisionPairs.has(pairKey)) {
            // 碰撞开始
            this.triggerCollisionEvent(a.gameObject, b.gameObject, 'enter');
          } else {
            // 碰撞持续
            this.triggerCollisionEvent(a.gameObject, b.gameObject, 'stay');
          }
          
          // 如果不是触发器，处理物理响应
          if (!a.collider.isTrigger && !b.collider.isTrigger) {
            this.resolveCollision(a, b);
          }
        }
      }
    }
    
    // 检测碰撞退出
    for (const [pairKey, _] of this.collisionPairs) {
      if (!newCollisionPairs.has(pairKey)) {
        const [aId, bId] = pairKey.split('_').map(Number);
        const a = Engine.instance.getGameObject(aId);
        const b = Engine.instance.getGameObject(bId);
        if (a && b) {
          this.triggerCollisionEvent(a, b, 'exit');
        }
      }
    }
    
    this.collisionPairs = newCollisionPairs;
  }

  private triggerCollisionEvent(a: any, b: any, type: 'enter' | 'stay' | 'exit'): void {
    // 修复：使用getAllComponents然后过滤Script类型
    const aAllComponents = a.getAllComponents();
    const aScripts = aAllComponents.filter((component: any): component is Script => 
      component instanceof Script
    );
    
    const bAllComponents = b.getAllComponents();
    const bScripts = bAllComponents.filter((component: any): component is Script => 
      component instanceof Script
    );
    
    // 获取碰撞器
    const aAllComponentsForCollider = a.getAllComponents();
    const aCollider = aAllComponentsForCollider.find((component: any): component is Collider => 
      component instanceof Collider
    );
    
    const bAllComponentsForCollider = b.getAllComponents();
    const bCollider = bAllComponentsForCollider.find((component: any): component is Collider => 
      component instanceof Collider
    );
    
    if (aCollider?.isTrigger || bCollider?.isTrigger) {
      // 触发器事件
      for (const script of aScripts) {
        if (type === 'enter' && script.onTriggerEnter) script.onTriggerEnter(bCollider);
        if (type === 'stay' && script.onTriggerStay) script.onTriggerStay(bCollider);
        if (type === 'exit' && script.onTriggerExit) script.onTriggerExit(bCollider);
      }
      
      for (const script of bScripts) {
        if (type === 'enter' && script.onTriggerEnter) script.onTriggerEnter(aCollider);
        if (type === 'stay' && script.onTriggerStay) script.onTriggerStay(aCollider);
        if (type === 'exit' && script.onTriggerExit) script.onTriggerExit(aCollider);
      }
    } else {
      // 碰撞事件
      for (const script of aScripts) {
        if (type === 'enter' && script.onCollisionEnter) script.onCollisionEnter(bCollider);
        if (type === 'stay' && script.onCollisionStay) script.onCollisionStay(bCollider);
        if (type === 'exit' && script.onCollisionExit) script.onCollisionExit(bCollider);
      }
      
      for (const script of bScripts) {
        if (type === 'enter' && script.onCollisionEnter) script.onCollisionEnter(aCollider);
        if (type === 'stay' && script.onCollisionStay) script.onCollisionStay(aCollider);
        if (type === 'exit' && script.onCollisionExit) script.onCollisionExit(aCollider);
      }
    }
  }

  private resolveCollision(a: { gameObject: any, collider: Collider }, b: { gameObject: any, collider: Collider }): void {
    // 使用getAllComponents然后过滤Rigidbody类型
    const aAllComponents = a.gameObject.getAllComponents();
    const aRb = aAllComponents.find((component: any): component is Rigidbody => 
      component instanceof Rigidbody
    );
    
    const bAllComponents = b.gameObject.getAllComponents();
    const bRb = bAllComponents.find((component: any): component is Rigidbody => 
      component instanceof Rigidbody
    );
    
    if (!aRb && !bRb) return;
    
    // 简单的碰撞响应（弹性碰撞）
    if (aRb && bRb && !aRb.isKinematic && !bRb.isKinematic) {
      const aTransform = a.gameObject.transform;
      const bTransform = b.gameObject.transform;
      
      // 计算碰撞法线
      const normal = bTransform.position.subtract(aTransform.position).normalized;
      
      // 相对速度
      const relativeVelocity = bRb.velocity.subtract(aRb.velocity);
      const velocityAlongNormal = Vector2.dot(relativeVelocity, normal);
      
      // 如果物体正在分离，不处理
      if (velocityAlongNormal > 0) return;
      
      // 计算冲量
      const restitution = 0.8; // 弹性系数
      const impulse = (2 * velocityAlongNormal) / (1 / aRb.mass + 1 / bRb.mass);
      
      // 应用冲量
      const impulseVector = normal.multiply(impulse * restitution);
      aRb.addImpulse(impulseVector);
      bRb.addImpulse(impulseVector.multiply(-1));
    }
  }
}