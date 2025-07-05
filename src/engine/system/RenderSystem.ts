import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';
import { Renderer } from '../components/Renderer';
import { Engine } from '../core/Engine';
import { ParticleSystem } from '../components/ParticleSystem';
import { RenderContext, Canvas2DRenderContext } from '../core/RenderContext';

export class RenderSystem extends ComponentSystem<Renderer> {
  private renderContext: RenderContext;
  private camera: { x: number, y: number, zoom: number } = { x: 0, y: 0, zoom: 1 };
  private canvas: HTMLCanvasElement;

  constructor(canvasOrContext: string | HTMLCanvasElement | RenderContext) {
    super();
    
    if (typeof canvasOrContext === 'string') {
      // Canvas ID
      const canvas = document.getElementById(canvasOrContext) as HTMLCanvasElement;
      if (!canvas) {
        throw new Error(`Canvas with id '${canvasOrContext}' not found`);
      }
      this.canvas = canvas;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get 2D context');
      }
      this.renderContext = new Canvas2DRenderContext(context);
    } else if (canvasOrContext instanceof HTMLCanvasElement) {
      // Canvas element
      this.canvas = canvasOrContext;
      const context = canvasOrContext.getContext('2d');
      if (!context) {
        throw new Error('Failed to get 2D context');
      }
      this.renderContext = new Canvas2DRenderContext(context);
    } else {
      // Custom RenderContext
      this.renderContext = canvasOrContext;
      // For custom contexts, we don't have a canvas reference
      this.canvas = document.createElement('canvas');
    }
    
    this.setupCanvas();
  }
  
  getComponentTypes(): string[] {
    // 处理所有Renderer子类
    return ['ShapeRenderer', 'SpriteRenderer', 'TextRenderer', 'Renderer'];
  }
  
  getPriority(): number {
    // 渲染系统通常最后执行
    return 1000;
  }

  private setupCanvas(): void {
    if (this.canvas && this.canvas.parentElement) {
      // 自适应画布大小
      const resizeCanvas = () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }
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

  update(deltaTime: number, components: Renderer[]): void {
    // 清空画布
    this.renderContext.clear();
    
    // 保存状态
    this.renderContext.save();
    
    // 应用相机变换
    this.renderContext.translate(this.renderContext.width / 2, this.renderContext.height / 2);
    this.renderContext.scale(this.camera.zoom, this.camera.zoom);
    this.renderContext.translate(-this.camera.x, -this.camera.y);
    
    // 获取所有渲染器并排序
    const renderers = components.filter(r => r.visible);
    renderers.sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      return a.sortingOrder - b.sortingOrder;
    });
    
    // 渲染所有渲染器
    for (const renderer of renderers) {
      try {
        renderer.render(this.renderContext);
      } catch (error) {
        console.error(`Error rendering ${renderer.getTypeName()}:`, error);
      }
    }
    
    // 渲染粒子系统
    this.renderParticles();
    
    // 恢复状态
    this.renderContext.restore();
    
    // 渲染UI（不受相机影响）
    this.renderUI();
  }

  private renderParticles(): void {
    const particleSystems = Engine.instance.getAllGameObjects()
      .map(go => go.getComponent(ParticleSystem))
      .filter(ps => ps !== null && ps.enabled) as ParticleSystem[];
    
    for (const ps of particleSystems) {
      const particles = ps.getParticles();
      
      for (const particle of particles) {
        this.renderContext.save();
        
        this.renderContext.globalAlpha = particle.alpha;
        this.renderContext.fillStyle = particle.color;
        
        this.renderContext.beginPath();
        this.renderContext.arc(
          particle.position.x,
          particle.position.y,
          particle.size,
          0,
          Math.PI * 2
        );
        this.renderContext.fill();
        
        this.renderContext.restore();
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
    const x = (screenX - this.renderContext.width / 2) / this.camera.zoom + this.camera.x;
    const y = (screenY - this.renderContext.height / 2) / this.camera.zoom + this.camera.y;
    return { x, y };
  }

  // 世界坐标转屏幕坐标
  worldToScreen(worldX: number, worldY: number): { x: number, y: number } {
    const x = (worldX - this.camera.x) * this.camera.zoom + this.renderContext.width / 2;
    const y = (worldY - this.camera.y) * this.camera.zoom + this.renderContext.height / 2;
    return { x, y };
  }
  
  // 获取渲染上下文
  getRenderContext(): RenderContext {
    return this.renderContext;
  }
  
  // 设置渲染上下文（支持动态切换渲染目标）
  setRenderContext(context: RenderContext): void {
    this.renderContext = context;
  }
}