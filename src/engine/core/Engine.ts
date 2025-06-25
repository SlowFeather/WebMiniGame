import { ComponentSystem } from './ComponentSystem';
import { Component } from './Component';
import { EventSystem } from './EventSystem';
import { ResourceManager } from './ResourceManager';
import { Time } from './Time';
import { GameObject } from './GameObject';

export class Engine {
  private static _instance: Engine;
  private systems = new Map<string, ComponentSystem>();
  private componentMap = new Map<string, Component[]>();
  private gameObjects = new Map<number, GameObject>();
  private running = false;
  private animationFrameId: number | null = null;
  
  public readonly eventSystem = EventSystem.instance;
  public readonly resourceManager = ResourceManager.instance;
  public readonly time = Time.instance;

  private constructor() {
    this.setupHotReload();
  }

  static get instance(): Engine {
    if (!this._instance) {
      this._instance = new Engine();
    }
    return this._instance;
  }

  // 注册系统
  registerSystem(typeName: string, system: ComponentSystem): void {
    console.log(`Registering system: ${typeName}`);
    this.systems.set(typeName, system);
    this.componentMap.set(typeName, []);
    system.onInit();
  }

  // 注册组件
  registerComponent(component: Component): void {
    const typeName = component.getTypeName();
    let components = this.componentMap.get(typeName);
    if (!components) {
      components = [];
      this.componentMap.set(typeName, components);
    }
    components.push(component);
    console.log(`Registered component: ${typeName}, total: ${components.length}`);
  }

  // 注销组件
  unregisterComponent(component: Component): void {
    const typeName = component.getTypeName();
    const components = this.componentMap.get(typeName);
    if (components) {
      const index = components.indexOf(component);
      if (index > -1) {
        components.splice(index, 1);
      }
    }
  }

  // 注册游戏对象
  registerGameObject(gameObject: GameObject): void {
    this.gameObjects.set(gameObject.id, gameObject);
    console.log(`Registered GameObject: ${gameObject.name} (ID: ${gameObject.id})`);
  }

  // 注销游戏对象
  unregisterGameObject(gameObject: GameObject): void {
    this.gameObjects.delete(gameObject.id);
  }

  // 获取游戏对象
  getGameObject(id: number): GameObject | undefined {
    return this.gameObjects.get(id);
  }

  // 获取所有游戏对象
  getAllGameObjects(): GameObject[] {
    return Array.from(this.gameObjects.values());
  }

  // 查找游戏对象
  findGameObjectsByTag(tag: string): GameObject[] {
    return Array.from(this.gameObjects.values()).filter(go => go.tag === tag);
  }

  findGameObjectByName(name: string): GameObject | null {
    return Array.from(this.gameObjects.values()).find(go => go.name === name) || null;
  }

  // 获取组件数量
  getComponentCount(typeName: string): number {
    return this.componentMap.get(typeName)?.length || 0;
  }

  // 获取系统
  getSystem<T extends ComponentSystem>(typeName: string): T | undefined {
    return this.systems.get(typeName) as T;
  }

  // 获取所有系统名称
  getSystemNames(): string[] {
    return Array.from(this.systems.keys());
  }

  // 获取组件统计
  getComponentStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    for (const [typeName, components] of this.componentMap) {
      stats[typeName] = components.length;
    }
    return stats;
  }

  // 主循环
  start(): void {
    if (this.running) return;
    
    console.log('Starting engine...');
    console.log('Registered systems:', this.getSystemNames());
    console.log('Component stats:', this.getComponentStats());
    
    this.running = true;
    this.time.reset();
    this.eventSystem.emit('engine:start');
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.eventSystem.emit('engine:stop');
  }

  private frameCount = 0;
  private lastFpsTime = 0;

  private loop = (): void => {
    if (!this.running) return;

    this.time.update();
    const deltaTime = this.time.deltaTime;
    
    // FPS调试信息（每秒输出一次）
    this.frameCount++;
    if (this.time.totalTime - this.lastFpsTime >= 1) {
      console.log(`FPS: ${this.frameCount}, Systems: ${this.systems.size}, GameObjects: ${this.gameObjects.size}`);
      this.frameCount = 0;
      this.lastFpsTime = this.time.totalTime;
    }

    // 更新所有系统
    let systemsUpdated = 0;
    for (const [typeName, system] of this.systems) {
      const components = this.componentMap.get(typeName) || [];
      
      // 过滤激活的组件
      const activeComponents = components.filter(component => 
        component.enabled && 
        component.gameObject && 
        component.gameObject.isActive
      );
      
      if (activeComponents.length > 0) {
        try {
          system.update(deltaTime, activeComponents);
          systemsUpdated++;
        } catch (error) {
          console.error(`Error updating system ${typeName}:`, error);
        }
      }
    }

    // 触发更新事件
    this.eventSystem.emit('engine:update', { deltaTime, systemsUpdated });

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // 清理
  clear(): void {
    console.log('Clearing engine...');
    this.stop();

    // 销毁所有游戏对象
    const gameObjectsToDestroy = Array.from(this.gameObjects.values());
    for (const gameObject of gameObjectsToDestroy) {
      gameObject.destroy();
    }
    this.gameObjects.clear();

    // 清理系统
    for (const system of this.systems.values()) {
      system.onDestroy();
    }
    this.systems.clear();

    // 清理组件映射
    this.componentMap.clear();

    // 清理资源
    this.resourceManager.clear();
    
    this.eventSystem.emit('engine:clear');
  }

  // 热重启
  restart(): void {
    console.log('Restarting engine...');
    this.eventSystem.emit('engine:restart');
    this.stop();
    this.clear();
    
    // 等待一帧再重启
    setTimeout(() => {
      this.start();
    }, 16);
  }

  // 强制渲染一帧
  forceRender(): void {
    console.log('Forcing render...');
    const renderSystem = this.systems.get('Render');
    if (renderSystem) {
      const renderComponents = this.componentMap.get('ShapeRenderer') || [];
      console.log('Render components found:', renderComponents.length);
      renderSystem.update(0.016, renderComponents);
    } else {
      console.warn('Render system not found!');
    }
  }

  // 设置热重载
  private setupHotReload(): void {
    if (typeof window !== 'undefined') {
      // 监听键盘事件
      window.addEventListener('keydown', (e) => {
        // Ctrl+R 热重启
        if (e.ctrlKey && e.key === 'r') {
          e.preventDefault();
          this.restart();
        }
        
        // F3 强制渲染
        if (e.key === 'F3') {
          e.preventDefault();
          this.forceRender();
        }
      });

      // 开发环境下的模块热替换支持
      if ((module as any).hot) {
        (module as any).hot.accept(() => {
          console.log('Hot reload detected, restarting engine...');
          this.restart();
        });
      }
    }
  }

  // 调试信息
  getDebugInfo(): any {
    return {
      running: this.running,
      systems: this.getSystemNames(),
      gameObjects: this.gameObjects.size,
      componentStats: this.getComponentStats(),
      time: {
        totalTime: this.time.totalTime,
        deltaTime: this.time.deltaTime,
        fps: Math.round(1000 / this.time.deltaTime)
      }
    };
  }

  // 序列化引擎状态
  serialize(): string {
    const state = {
      gameObjects: Array.from(this.gameObjects.values()).map(go => go.serialize()),
      time: {
        startTime: this.time.startTime,
        totalTime: this.time.totalTime
      }
    };
    return JSON.stringify(state);
  }

  // 反序列化引擎状态
  deserialize(data: string): void {
    try {
      const state = JSON.parse(data);
      
      // 清理当前状态
      this.clear();
      
      // 恢复游戏对象
      // 注意：这需要游戏对象支持反序列化
      // 这里只是示例，实际实现需要更复杂的逻辑
      
      console.log('Engine state restored');
    } catch (error) {
      console.error('Failed to deserialize engine state:', error);
    }
  }
}