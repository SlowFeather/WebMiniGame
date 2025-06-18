import { Renderer } from './Renderer';
import { ResourceManager } from '../core/ResourceManager';

export class SpriteRenderer extends Renderer {
  public spriteId: string | null = null;
  public color: string = '#ffffff';
  public alpha: number = 1.0;
  public flipX: boolean = false;
  public flipY: boolean = false;

  getTypeName(): string {
    return 'SpriteRenderer';
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.visible || !this.spriteId) return;

    const sprite = ResourceManager.instance.get<HTMLImageElement>(this.spriteId);
    if (!sprite) return;

    const transform = this.gameObject.transform;
    
    context.save();
    
    // 应用变换
    context.translate(transform.position.x, transform.position.y);
    context.rotate(transform.rotation * Math.PI / 180);
    context.scale(
      transform.scale.x * (this.flipX ? -1 : 1),
      transform.scale.y * (this.flipY ? -1 : 1)
    );
    
    // 应用透明度
    context.globalAlpha = this.alpha;
    
    // 绘制精灵
    context.drawImage(
      sprite,
      -sprite.width / 2,
      -sprite.height / 2,
      sprite.width,
      sprite.height
    );
    
    context.restore();
  }

  serialize(): any {
    return {
      spriteId: this.spriteId,
      color: this.color,
      alpha: this.alpha,
      flipX: this.flipX,
      flipY: this.flipY,
      visible: this.visible,
      layer: this.layer,
      sortingOrder: this.sortingOrder
    };
  }
}