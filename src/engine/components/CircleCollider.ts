import { Collider } from './Collider';
import { Vector2 } from '../core/Vector2';
import { BoxCollider } from './BoxCollider';

export class CircleCollider extends Collider {
  public radius: number = 25;

  getTypeName(): string {
    return 'CircleCollider';
  }

  checkCollision(other: Collider): boolean {
    const transform = this.gameObject.transform;
    const worldPos = transform.worldPosition.add(this.offset);
    const worldRadius = this.radius * Math.max(transform.scale.x, transform.scale.y);

    if (other instanceof CircleCollider) {
      const otherTransform = other.gameObject.transform;
      const otherWorldPos = otherTransform.worldPosition.add(other.offset);
      const otherWorldRadius = other.radius * Math.max(otherTransform.scale.x, otherTransform.scale.y);
      
      const distance = Vector2.distance(worldPos, otherWorldPos);
      return distance <= worldRadius + otherWorldRadius;
    } else if (other instanceof BoxCollider) {
      // 圆形与矩形的碰撞检测
      const boxBounds = other.getWorldBounds();
      
      // 找到矩形上最近的点
      const closestX = Math.max(boxBounds.min.x, Math.min(worldPos.x, boxBounds.max.x));
      const closestY = Math.max(boxBounds.min.y, Math.min(worldPos.y, boxBounds.max.y));
      
      const distance = Vector2.distance(worldPos, new Vector2(closestX, closestY));
      return distance <= worldRadius;
    }
    
    return false;
  }

  getWorldBounds(): { min: Vector2, max: Vector2 } {
    const transform = this.gameObject.transform;
    const worldPos = transform.worldPosition.add(this.offset);
    const worldRadius = this.radius * Math.max(transform.scale.x, transform.scale.y);
    
    return {
      min: new Vector2(worldPos.x - worldRadius, worldPos.y - worldRadius),
      max: new Vector2(worldPos.x + worldRadius, worldPos.y + worldRadius)
    };
  }
}