import { Renderer } from './Renderer';

export enum ShapeType {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Triangle = 'triangle'
}

export class ShapeRenderer extends Renderer {
  public shapeType: ShapeType = ShapeType.Rectangle;
  public fillColor: string = '#ffffff';
  public strokeColor: string = '#000000';
  public strokeWidth: number = 0;
  public width: number = 50;
  public height: number = 50;
  public radius: number = 25;

  getTypeName(): string {
    return 'ShapeRenderer';
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const transform = this.gameObject.transform;
    
    context.save();
    
    // 应用变换
    context.translate(transform.position.x, transform.position.y);
    context.rotate(transform.rotation * Math.PI / 180);
    context.scale(transform.scale.x, transform.scale.y);
    
    // 设置样式
    context.fillStyle = this.fillColor;
    context.strokeStyle = this.strokeColor;
    context.lineWidth = this.strokeWidth;
    
    // 绘制形状
    switch (this.shapeType) {
      case ShapeType.Rectangle:
        context.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        if (this.strokeWidth > 0) {
          context.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        break;
        
      case ShapeType.Circle:
        context.beginPath();
        context.arc(0, 0, this.radius, 0, Math.PI * 2);
        context.fill();
        if (this.strokeWidth > 0) {
          context.stroke();
        }
        break;
        
      case ShapeType.Triangle:
        context.beginPath();
        context.moveTo(0, -this.height / 2);
        context.lineTo(-this.width / 2, this.height / 2);
        context.lineTo(this.width / 2, this.height / 2);
        context.closePath();
        context.fill();
        if (this.strokeWidth > 0) {
          context.stroke();
        }
        break;
    }
    
    context.restore();
  }
}