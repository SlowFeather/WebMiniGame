import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';
import { Engine } from '../core/Engine';
import { Vector2 } from '../core/Vector2';
import { Script } from '../components/Script';

export class InputSystem extends ComponentSystem {
  private keys: Map<string, boolean> = new Map();
  private mousePosition: Vector2 = Vector2.zero;
  private mouseButtons: Map<number, boolean> = new Map();
  private touches: Map<number, Touch> = new Map();
  private renderSystem: RenderSystem | null = null;

  onInit(): void {
    this.setupEventListeners();
    
    // 获取渲染系统引用
    setTimeout(() => {
      this.renderSystem = Engine.instance.getSystem<RenderSystem>('RenderSystem');
    }, 0);
  }

  private setupEventListeners(): void {
    // 键盘事件
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // 鼠标事件
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    
    // 触摸事件
    window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    
    // 阻止右键菜单
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onDestroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys.set(e.code, true);
    Engine.instance.eventSystem.emit('input:keydown', { key: e.code, event: e });
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.set(e.code, false);
    Engine.instance.eventSystem.emit('input:keyup', { key: e.code, event: e });
  };

  private handleMouseDown = (e: MouseEvent): void => {
    this.mouseButtons.set(e.button, true);
    this.mousePosition = new Vector2(e.clientX, e.clientY);
    
    Engine.instance.eventSystem.emit('input:mousedown', { 
      button: e.button, 
      position: this.mousePosition,
      worldPosition: this.getWorldMousePosition(),
      event: e 
    });
    
    // 检测点击的游戏对象
    this.checkMouseInteraction('down');
  };

  private handleMouseUp = (e: MouseEvent): void => {
    this.mouseButtons.set(e.button, false);
    
    Engine.instance.eventSystem.emit('input:mouseup', { 
      button: e.button, 
      position: this.mousePosition,
      worldPosition: this.getWorldMousePosition(),
      event: e 
    });
    
    this.checkMouseInteraction('up');
  };

  private handleMouseMove = (e: MouseEvent): void => {
    this.mousePosition = new Vector2(e.clientX, e.clientY);
    
    Engine.instance.eventSystem.emit('input:mousemove', { 
      position: this.mousePosition,
      worldPosition: this.getWorldMousePosition(),
      event: e 
    });
  };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.touches.set(touch.identifier, touch);
    }
    
    Engine.instance.eventSystem.emit('input:touchstart', { 
      touches: Array.from(this.touches.values()),
      event: e 
    });
    
    this.checkTouchInteraction('start');
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.touches.set(touch.identifier, touch);
    }
    
    Engine.instance.eventSystem.emit('input:touchmove', { 
      touches: Array.from(this.touches.values()),
      event: e 
    });
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.touches.delete(touch.identifier);
    }
    
    Engine.instance.eventSystem.emit('input:touchend', { 
      touches: Array.from(this.touches.values()),
      event: e 
    });
    
    this.checkTouchInteraction('end');
  };

  private getWorldMousePosition(): Vector2 {
    if (!this.renderSystem) return this.mousePosition;
    
    const worldPos = this.renderSystem.screenToWorld(
      this.mousePosition.x,
      this.mousePosition.y
    );
    
    return new Vector2(worldPos.x, worldPos.y);
  }

  private checkMouseInteraction(type: 'down' | 'up'): void {
    const worldPos = this.getWorldMousePosition();
    const gameObjects = Engine.instance.getAllGameObjects();
    
    for (const go of gameObjects) {
      const scripts = go.getComponents(Script);
      
      // 简单的点击检测（基于位置）
      const transform = go.transform;
      const distance = Vector2.distance(transform.position, worldPos);
      
      if (distance < 50) { // 简单的半径检测
        for (const script of scripts) {
          if (type === 'down' && script.onMouseDown) {
            script.onMouseDown();
          } else if (type === 'up' && script.onMouseUp) {
            script.onMouseUp();
          }
        }
      }
    }
  }

  private checkTouchInteraction(type: 'start' | 'end'): void {
    const touches = Array.from(this.touches.values());
    const gameObjects = Engine.instance.getAllGameObjects();
    
    for (const go of gameObjects) {
      const scripts = go.getComponents(Script);
      
      for (const script of scripts) {
        if (type === 'start' && script.onTouchStart) {
          script.onTouchStart(touches);
        } else if (type === 'end' && script.onTouchEnd) {
          script.onTouchEnd(touches);
        }
      }
    }
  }

  // 公共API
  isKeyPressed(key: string): boolean {
    return this.keys.get(key) || false;
  }

  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.get(button) || false;
  }

  getMousePosition(): Vector2 {
    return this.mousePosition.clone();
  }

  getMouseWorldPosition(): Vector2 {
    return this.getWorldMousePosition();
  }

  getTouches(): Touch[] {
    return Array.from(this.touches.values());
  }

  update(deltaTime: number, components: Component[]): void {
    // Input系统主要处理事件，不需要常规更新
  }
}