import { ComponentSystem } from './ComponentSystem';
import { Component } from './Component';
import { EventSystem, EventTiming } from './EventSystem';
import { ResourceManager } from './ResourceManager';
import { Time } from './Time';
import { GameObject } from './GameObject';

// 组件工厂注册表
type ComponentConstructor = new () => Component;
const componentRegistry = new Map<string, ComponentConstructor>();

// 注册组件类型（用于序列化/反序列化）
export function registerComponentType(typeName: string, constructor: ComponentConstructor): void {
  componentRegistry.set(typeName, constructor);
}

// 获取组件构造函数
export function getComponentConstructor(typeName: string): ComponentConstructor | undefined {
  return componentRegistry.get(typeName);
}

export class Engine {
  private static _instance: Engine;
  private systems = new Map<string, ComponentSystem>();
  private systemsPrioritySorted: ComponentSystem[] = [];
  private componentMap = new Map<string, Component[]>();
  private activeComponentsCache = new Map<string, Component[]>();
  private gameObjects = new Map<number, GameObject>();
  private running = false;
  private animationFrameId: number | null = null;
  
  // 性能监控
  private performanceMonitoring = true;
  private systemPerformance = new Map<string, any>();
  
  public readonly eventSystem = EventSystem.instance;
  public readonly resourceManager = ResourceManager.instance;
  public readonly time = Time.instance;

  private constructor() {
    this.setupHotReload();
    this.setupPerformanceMonitoring();
  }

  static get instance(): Engine {
    if (!this._instance) {
      this._instance = new Engine();
    }
    return this._instance;
  }

  // 注册系统
  registerSystem(systemName: string, system: ComponentSystem): void {
    console.log(`Registering system: ${systemName}`);
    this.systems.set(systemName, system);
    
    // 获取系统处理的组件类型
    const componentTypes = system.getComponentTypes();
    
    // 为每个组件类型创建数组和缓存
    componentTypes.forEach(componentType => {
      if (!this.componentMap.has(componentType)) {
        this.componentMap.set(componentType, []);
        this.activeComponentsCache.set(componentType, []);
      }
    });
    
    // 按优先级重新排序系统
    this.updateSystemPriority();
    
    system.onInit();
  }

  // 更新系统优先级排序
  private updateSystemPriority(): void {
    this.systemsPrioritySorted = Array.from(this.systems.values())
      .sort((a, b) => a.getPriority() - b.getPriority());
  }

  // 注册组件
  registerComponent(component: Component): void {
    const typeName = component.getTypeName();
    let components = this.componentMap.get(typeName);
    if (!components) {
      components = [];
      this.componentMap.set(typeName, components);
      this.activeComponentsCache.set(typeName, []);
    }
    components.push(component);
    
    // 如果组件已激活，添加到激活缓存
    if (component.enabled && component.gameObject?.isActive) {
      this.addToActiveCache(typeName, component);
    }
    
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
        this.removeFromActiveCache(typeName, component);
      }
    }
  }

  // 组件状态改变时更新缓存
  onComponentStateChanged(component: Component): void {
    const typeName = component.getTypeName();
    if (component.enabled && component.gameObject?.isActive) {
      this.addToActiveCache(typeName, component);
    } else {
      this.removeFromActiveCache(typeName, component);
    }
  }

  // 添加到激活缓存
  private addToActiveCache(typeName: string, component: Component): void {
    const cache = this.activeComponentsCache.get(typeName);
    if (cache && !cache.includes(component)) {
      cache.push(component);
    }
  }

  // 从激活缓存移除
  private removeFromActiveCache(typeName: string, component: Component): void {
    const cache = this.activeComponentsCache.get(typeName);
    if (cache) {
      const index = cache.indexOf(component);
      if (index > -1) {
        cache.splice(index, 1);
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

  // 获取激活的组件数量
  getActiveComponentCount(typeName: string): number {
    return this.activeComponentsCache.get(typeName)?.length || 0;
  }

  // 获取所有组件
  getComponentsByType(typeName: string): Component[] {
    return this.componentMap.get(typeName) || [];
  }

  // 获取激活的组件
  getActiveComponentsByType(typeName: string): Component[] {
    return this.activeComponentsCache.get(typeName) || [];
  }

  // 获取系统
  getSystem<T extends ComponentSystem>(systemName: string): T | undefined {
    return this.systems.get(systemName) as T;
  }

  // 获取所有系统名称
  getSystemNames(): string[] {
    return Array.from(this.systems.keys());
  }

  // 获取组件统计
  getComponentStats(): { [key: string]: { total: number, active: number } } {
    const stats: { [key: string]: { total: number, active: number } } = {};
    for (const [typeName, components] of this.componentMap) {
      stats[typeName] = {
        total: components.length,
        active: this.activeComponentsCache.get(typeName)?.length || 0
      };
    }
    return stats;
  }

  // 设置性能监控
  private setupPerformanceMonitoring(): void {
    if (!this.performanceMonitoring) return;
    
    // 每秒输出性能报告
    setInterval(() => {
      if (this.running) {
        this.outputPerformanceReport();
      }
    }, 1000);
  }

  // 输出性能报告
  private outputPerformanceReport(): void {
    console.group('Engine Performance Report');
    console.log('FPS:', Math.round(1000 / this.time.deltaTime));
    console.log('GameObjects:', this.gameObjects.size);
    console.log('Component Stats:', this.getComponentStats());
    
    console.group('System Performance:');
    for (const [systemName, system] of this.systems) {
      const stats = system.getPerformanceStats();
      console.log(`${systemName}: avg ${stats.averageUpdateTime.toFixed(2)}ms, last ${stats.lastUpdateTime.toFixed(2)}ms`);
    }
    console.groupEnd();
    
    console.groupEnd();
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
  private lastCleanupTime = 0;

  private loop = (): void => {
    if (!this.running) return;

    this.time.update();
    const deltaTime = this.time.deltaTime;
    
    // 处理延迟事件
    this.eventSystem.processDeferredEvents(EventTiming.PRE_UPDATE);
    
    // 更新所有系统（按优先级顺序）
    let systemsUpdated = 0;
    for (const system of this.systemsPrioritySorted) {
      const componentTypes = system.getComponentTypes();
      const allComponents: Component[] = [];
      
      // 从缓存中收集激活的组件
      componentTypes.forEach(componentType => {
        const activeComponents = this.activeComponentsCache.get(componentType) || [];
        allComponents.push(...activeComponents);
      });
      
      if (allComponents.length > 0) {
        try {
          system.performUpdate(deltaTime, allComponents);
          systemsUpdated++;
        } catch (error) {
          console.error(`Error updating system ${system.constructor.name}:`, error);
        }
      }
    }
    
    // 处理更新后的延迟事件
    this.eventSystem.processDeferredEvents(EventTiming.UPDATE);
    this.eventSystem.processDeferredEvents(EventTiming.POST_UPDATE);
    
    // 触发更新事件
    this.eventSystem.emit('engine:update', { deltaTime, systemsUpdated });
    
    // 定期清理过期事件（每10秒）
    if (this.time.totalTime - this.lastCleanupTime > 10) {
      this.eventSystem.cleanupExpiredEvents();
      this.lastCleanupTime = this.time.totalTime;
    }
    
    // 处理帧结束事件
    this.eventSystem.processDeferredEvents(EventTiming.END_FRAME);

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
    this.systemsPrioritySorted = [];

    // 清理组件映射和缓存
    this.componentMap.clear();
    this.activeComponentsCache.clear();

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
      const renderComponents = this.getActiveComponentsByType('ShapeRenderer')
        .concat(this.getActiveComponentsByType('SpriteRenderer'));
      console.log('Render components found:', renderComponents.length);
      renderSystem.performUpdate(0.016, renderComponents);
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
        
        // F4 切换性能监控
        if (e.key === 'F4') {
          e.preventDefault();
          this.performanceMonitoring = !this.performanceMonitoring;
          console.log('Performance monitoring:', this.performanceMonitoring);
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
    const systemStats: any = {};
    for (const [name, system] of this.systems) {
      systemStats[name] = system.getPerformanceStats();
    }
    
    return {
      running: this.running,
      systems: this.getSystemNames(),
      gameObjects: this.gameObjects.size,
      componentStats: this.getComponentStats(),
      systemPerformance: systemStats,
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
      if (state.gameObjects) {
        for (const goData of state.gameObjects) {
          GameObject.deserialize(goData);
        }
      }
      
      console.log('Engine state restored');
    } catch (error) {
      console.error('Failed to deserialize engine state:', error);
    }
  }
}