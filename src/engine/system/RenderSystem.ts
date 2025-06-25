import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';
import { Renderer } from '../components/Renderer';
import { Engine } from '../core/Engine';
import { ParticleSystem } from '../components/ParticleSystem';

export class RenderSystem extends ComponentSystem {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private camera: { x: number, y: number, zoom: number } = { x: 0, y: 0, zoom: 1 };

  constructor(canvasId: string) {
    super();
    
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id '${canvasId}' not found`);
    }
    
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context');
    }
    
    this.context = context;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    // 自适应画布大小
    const resizeCanvas = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  onInit(): void {
    // 监听相机事件
    Engine.instance.eventSystem.on('camera:move', (data) => {
      this.camera.x = data.x;
      this.camera.y = data.y;
    });
    
    Engine.instance.eventSystem.on('camera:zoom', (data) => {
      this.camera.zoom = data.zoom;
    });
  }

  update(deltaTime: number, components: Component[]): void {
    // 清空画布
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 保存状态
    this.context.save();
    
    // 应用相机变换
    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.context.scale(this.camera.zoom, this.camera.zoom);
    this.context.translate(-this.camera.x, -this.camera.y);

    
    // 获取所有渲染器并排序
    const renderers = components.filter(c => c instanceof Renderer && c.enabled) as Renderer[];
    renderers.sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      return a.sortingOrder - b.sortingOrder;
    });
    
    // 渲染所有渲染器
    for (const renderer of renderers) {
      renderer.render(this.context);
    }
    
    // 渲染粒子系统
    this.renderParticles();
    
    // 恢复状态
    this.context.restore();
    
    // 渲染UI（不受相机影响）
    this.renderUI();
  }

  private renderParticles(): void {
    const particleSystems = Engine.instance.getAllGameObjects()
      .map(go => go.getComponent(ParticleSystem))
      .filter(ps => ps !== null) as ParticleSystem[];
    
    for (const ps of particleSystems) {
      const particles = ps.getParticles();
      
      for (const particle of particles) {
        this.context.save();
        
        this.context.globalAlpha = particle.alpha;
        this.context.fillStyle = particle.color;
        
        this.context.beginPath();
        this.context.arc(
          particle.position.x,
          particle.position.y,
          particle.size,
          0,
          Math.PI * 2
        );
        this.context.fill();
        
        this.context.restore();
      }
    }
  }

  private renderUI(): void {
    // UI渲染逻辑（如果需要Canvas绘制的UI）
    // 大部分UI使用DOM元素，所以这里可能为空
  }

  // 获取相机
  getCamera(): { x: number, y: number, zoom: number } {
    return { ...this.camera };
  }

  // 设置相机
  setCamera(x: number, y: number, zoom: number = 1): void {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.zoom = zoom;
  }

  // 屏幕坐标转世界坐标
  screenToWorld(screenX: number, screenY: number): { x: number, y: number } {
    const x = (screenX - this.canvas.width / 2) / this.camera.zoom + this.camera.x;
    const y = (screenY - this.canvas.height / 2) / this.camera.zoom + this.camera.y;
    return { x, y };
  }

  // 世界坐标转屏幕坐标
  worldToScreen(worldX: number, worldY: number): { x: number, y: number } {
    const x = (worldX - this.camera.x) * this.camera.zoom + this.canvas.width / 2;
    const y = (worldY - this.camera.y) * this.camera.zoom + this.canvas.height / 2;
    return { x, y };
  }
}