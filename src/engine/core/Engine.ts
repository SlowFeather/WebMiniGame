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

  findGameObjectByName(name: string): GameObject | undefined {
    return Array.from(this.gameObjects.values()).find(go => go.name === name);
  }

  // 获取组件数量
  getComponentCount(typeName: string): number {
    return this.componentMap.get(typeName)?.length || 0;
  }

  // 获取系统
  getSystem<T extends ComponentSystem>(typeName: string): T | undefined {
    return this.systems.get(typeName) as T;
  }

  // 主循环
  start(): void {
    if (this.running) return;
    
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

  private loop = (): void => {
    if (!this.running) return;

    this.time.update();
    const deltaTime = this.time.deltaTime;

    // 更新所有系统
    for (const [typeName, system] of this.systems) {
      const components = this.componentMap.get(typeName);
      if (components && components.length > 0) {
        system.update(deltaTime, components);
      }
    }

    // 触发更新事件
    this.eventSystem.emit('engine:update', { deltaTime });

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // 清理
  clear(): void {
    this.stop();

    // 销毁所有游戏对象
    for (const gameObject of this.gameObjects.values()) {
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
    this.eventSystem.emit('engine:restart');
    this.stop();
    this.clear();
    this.start();
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
