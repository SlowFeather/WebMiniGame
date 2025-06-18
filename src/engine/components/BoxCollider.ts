import { Collider } from './Collider';
import { Vector2 } from '../core/Vector2';

export class BoxCollider extends Collider {
  public width: number = 50;
  public height: number = 50;

  getTypeName(): string {
    return 'BoxCollider';
  }

  checkCollision(other: Collider): boolean {
    if (other instanceof BoxCollider) {
      const thisBounds = this.getWorldBounds();
      const otherBounds = other.getWorldBounds();
      
      return !(thisBounds.max.x < otherBounds.min.x ||
               thisBounds.min.x > otherBounds.max.x ||
               thisBounds.max.y < otherBounds.min.y ||
               thisBounds.min.y > otherBounds.max.y);
    }
    
    // 其他碰撞器类型的检测
    return false;
  }

  getWorldBounds(): { min: Vector2, max: Vector2 } {
    const transform = this.gameObject.transform;
    const worldPos = transform.worldPosition.add(this.offset);
    
    const halfWidth = (this.width * transform.scale.x) / 2;
    const halfHeight = (this.height * transform.scale.y) / 2;
    
    return {
      min: new Vector2(worldPos.x - halfWidth, worldPos.y - halfHeight),
      max: new Vector2(worldPos.x + halfWidth, worldPos.y + halfHeight)
    };
  }
}