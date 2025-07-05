import { Renderer } from './Renderer';
import { RenderContext } from '../core/RenderContext';

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

  render(context: RenderContext): void {
    if (!this.visible) return;

    const transform = this.transform;
    
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
  
  serialize(): any {
    return {
      shapeType: this.shapeType,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      width: this.width,
      height: this.height,
      radius: this.radius,
      visible: this.visible,
      layer: this.layer,
      sortingOrder: this.sortingOrder
    };
  }
  
  deserialize(data: any): void {
    if (data.shapeType !== undefined) this.shapeType = data.shapeType;
    if (data.fillColor !== undefined) this.fillColor = data.fillColor;
    if (data.strokeColor !== undefined) this.strokeColor = data.strokeColor;
    if (data.strokeWidth !== undefined) this.strokeWidth = data.strokeWidth;
    if (data.width !== undefined) this.width = data.width;
    if (data.height !== undefined) this.height = data.height;
    if (data.radius !== undefined) this.radius = data.radius;
    if (data.visible !== undefined) this.visible = data.visible;
    if (data.layer !== undefined) this.layer = data.layer;
    if (data.sortingOrder !== undefined) this.sortingOrder = data.sortingOrder;
  }
  
  clone(): ShapeRenderer {
    const cloned = new ShapeRenderer();
    cloned.shapeType = this.shapeType;
    cloned.fillColor = this.fillColor;
    cloned.strokeColor = this.strokeColor;
    cloned.strokeWidth = this.strokeWidth;
    cloned.width = this.width;
    cloned.height = this.height;
    cloned.radius = this.radius;
    cloned.visible = this.visible;
    cloned.layer = this.layer;
    cloned.sortingOrder = this.sortingOrder;
    return cloned;
  }
}