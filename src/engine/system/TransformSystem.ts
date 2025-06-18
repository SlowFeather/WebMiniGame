import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';
import { Transform } from '../components/Transform';

export class TransformSystem extends ComponentSystem {
  update(deltaTime: number, components: Component[]): void {
    const transforms = components as Transform[];
    
    for (const transform of transforms) {
      if (!transform.enabled) continue;
      
      // 更新位置
      transform.position.x += transform.velocity.x * deltaTime;
      transform.position.y += transform.velocity.y * deltaTime;
      
      // 更新旋转
      transform.rotation += transform.angularVelocity * deltaTime;
      
      // 应用阻尼
      transform.velocity.x *= (1 - 0.1 * deltaTime);
      transform.velocity.y *= (1 - 0.1 * deltaTime);
      transform.angularVelocity *= (1 - 0.1 * deltaTime);
    }
  }
}