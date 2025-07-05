import { ComponentSystem } from '../core/ComponentSystem';
import { Transform } from '../components/Transform';

export class TransformSystem extends ComponentSystem<Transform> {
  getComponentTypes(): string[] {
    return ['Transform'];
  }
  
  // Transform系统应该最先执行
  getPriority(): number {
    return 0;
  }
  
  update(deltaTime: number, components: Transform[]): void {
    for (const transform of components) {
      if (!transform.enabled) continue;
      
      // 更新位置
      transform.position.x += transform.velocity.x * deltaTime;
      transform.position.y += transform.velocity.y * deltaTime;
      
      // 更新旋转
      transform.rotation += transform.angularVelocity * deltaTime;
      
      // 应用阻尼
      if (transform.linearDamping > 0) {
        const dampingFactor = Math.pow(1 - transform.linearDamping, deltaTime);
        transform.velocity.x *= dampingFactor;
        transform.velocity.y *= dampingFactor;
      }
      
      if (transform.angularDamping > 0) {
        const angularDampingFactor = Math.pow(1 - transform.angularDamping, deltaTime);
        transform.angularVelocity *= angularDampingFactor;
      }
    }
  }
}