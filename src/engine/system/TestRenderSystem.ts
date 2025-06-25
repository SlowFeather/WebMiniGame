// 简化的测试用RenderSystem
import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';

export class TestRenderSystem extends ComponentSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frameCount = 0;

  constructor(canvasId: string) {
    super();
    
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id '${canvasId}' not found!`);
    }
    
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context!');
    }
    
    this.ctx = ctx;
    
    // 设置canvas大小
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    console.log('TestRenderSystem initialized with canvas:', canvasId);
  }

  onInit(): void {
    console.log('TestRenderSystem onInit called');
    // 初始渲染测试
    this.renderTest();
  }

  private renderTest(): void {
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(10, 10, 50, 50);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('RenderSystem Active', 70, 30);
    console.log('Initial render test completed');
  }

  update(deltaTime: number, components: Component[]): void {
    this.frameCount++;
    
    // 每60帧输出一次调试信息
    if (this.frameCount % 60 === 0) {
      console.log(`TestRenderSystem update: ${components.length} components`);
    }
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制背景渐变
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 渲染所有ShapeRenderer组件
    let renderedCount = 0;
    for (const component of components) {
      if (component.getTypeName() === 'ShapeRenderer') {
        this.renderShape(component as any);
        renderedCount++;
      }
    }
    
    // 渲染调试信息
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Frame: ${this.frameCount}`, 10, 20);
    this.ctx.fillText(`Components: ${components.length}`, 10, 35);
    this.ctx.fillText(`Rendered: ${renderedCount}`, 10, 50);
    this.ctx.fillText(`DeltaTime: ${deltaTime.toFixed(3)}`, 10, 65);
  }

  private renderShape(renderer: any): void {
    if (!renderer.gameObject || !renderer.gameObject.transform) {
      return;
    }
    
    const transform = renderer.gameObject.transform;
    const pos = transform.position;
    
    this.ctx.save();
    
    // 应用变换
    this.ctx.translate(pos.x, pos.y);
    this.ctx.rotate((transform.rotation || 0) * Math.PI / 180);
    
    // 设置样式
    this.ctx.fillStyle = renderer.fillColor || '#FFFFFF';
    if (renderer.strokeColor) {
      this.ctx.strokeStyle = renderer.strokeColor;
      this.ctx.lineWidth = renderer.strokeWidth || 1;
    }
    
    // 根据形状类型渲染
    switch (renderer.shapeType) {
      case 'Rectangle':
        const width = renderer.width || 50;
        const height = renderer.height || 50;
        this.ctx.fillRect(-width/2, -height/2, width, height);
        if (renderer.strokeColor) {
          this.ctx.strokeRect(-width/2, -height/2, width, height);
        }
        break;
        
      case 'Circle':
        const radius = renderer.radius || 25;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        if (renderer.strokeColor) {
          this.ctx.stroke();
        }
        break;
        
      case 'Triangle':
        const triWidth = renderer.width || 30;
        const triHeight = renderer.height || 30;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -triHeight/2);
        this.ctx.lineTo(triWidth/2, triHeight/2);
        this.ctx.lineTo(-triWidth/2, triHeight/2);
        this.ctx.closePath();
        this.ctx.fill();
        if (renderer.strokeColor) {
          this.ctx.stroke();
        }
        break;
        
      default:
        // 默认渲染一个小方块
        this.ctx.fillRect(-10, -10, 20, 20);
    }
    
    this.ctx.restore();
  }

  onDestroy(): void {
    console.log('TestRenderSystem destroyed');
  }
}