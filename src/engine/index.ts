import { BoxCollider } from './components/BoxCollider';
import { CircleCollider } from './components/CircleCollider';
import { Rigidbody } from './components/Rigidbody';
import { ShapeRenderer, ShapeType } from './components/ShapeRenderer';
import { SpriteRenderer } from './components/SpriteRenderer';
import { Component } from './core/Component';
import { ComponentSystem } from './core/ComponentSystem';
import { Engine } from './core/Engine';
import { GameObject } from './core/GameObject';
import { Vector2 } from './core/Vector2';
import { AnimationSystem } from './system/AnimationSystem';
import { AudioSystem } from './system/AudioSystem';
import { InputSystem } from './system/InputSystem';
import { PhysicsSystem } from './system/PhysicsSystem';
import { RenderSystem } from './system/RenderSystem';
import { ScriptSystem } from './system/ScriptSystem';
import { TransformSystem } from './system/TransformSystem';
import { UISystem } from './system/UISystem';

// 核心模块导出
export { Engine } from './core/Engine';
export { GameObject } from './core/GameObject';
export { Component } from './core/Component';
export { ComponentSystem } from './core/ComponentSystem';
export { EventSystem } from './core/EventSystem';
export { ResourceManager } from './core/ResourceManager';
export { Time } from './core/Time';
export { Vector2 } from './core/Vector2';

// 组件导出
export { Transform } from './components/Transform';
export { Renderer } from './components/Renderer';
export { SpriteRenderer } from './components/SpriteRenderer';
export { ShapeRenderer, ShapeType } from './components/ShapeRenderer';
export { Collider } from './components/Collider';
export { BoxCollider } from './components/BoxCollider';
export { CircleCollider } from './components/CircleCollider';
export { Rigidbody } from './components/Rigidbody';
export { AudioSource } from './components/AudioSource';
export { Script } from './components/Script';
export { Animator, AnimationClip, AnimationFrame } from './components/Animator';
export { ParticleSystem, Particle } from './components/ParticleSystem';
export { UIElement } from './components/UIElement';
export { Button } from './components/Button';
export { Text } from './components/Text';

// 系统导出
export { TransformSystem } from './system/TransformSystem';
export { RenderSystem } from './system/RenderSystem';
export { PhysicsSystem } from './system/PhysicsSystem';
export { ScriptSystem } from './system/ScriptSystem';
export { AnimationSystem } from './system/AnimationSystem';
export { AudioSystem } from './system/AudioSystem';
export { UISystem } from './system/UISystem';
export { InputSystem } from './system/InputSystem';

// 类型导出
export type { Resource } from './core/ResourceManager';

// 简化的快速启动函数
export function createGame(config: {
  canvasId: string;
  width?: number;
  height?: number;
  systems?: Array<{ name: string; system: ComponentSystem }>;
  onInit?: (engine: Engine) => void;
  onStart?: (engine: Engine) => void;
}): Engine {
  const engine = Engine.instance;
  
  // 创建画布（如果不存在）
  let canvas = document.getElementById(config.canvasId) as HTMLCanvasElement;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = config.canvasId;
    canvas.width = config.width || 800;
    canvas.height = config.height || 600;
    document.body.appendChild(canvas);
  }
  
  // 注册默认系统
  engine.registerSystem('Transform', new TransformSystem());
  engine.registerSystem('RenderSystem', new RenderSystem(config.canvasId));
  engine.registerSystem('Physics', new PhysicsSystem());
  engine.registerSystem('Script', new ScriptSystem());
  engine.registerSystem('Animation', new AnimationSystem());
  engine.registerSystem('Audio', new AudioSystem());
  engine.registerSystem('UI', new UISystem());
  engine.registerSystem('InputSystem', new InputSystem());
  
  // 注册自定义系统
  if (config.systems) {
    for (const { name, system } of config.systems) {
      engine.registerSystem(name, system);
    }
  }
  
  // 初始化回调
  if (config.onInit) {
    config.onInit(engine);
  }
  
  // 启动回调
  if (config.onStart) {
    engine.eventSystem.on('engine:start', () => config.onStart!(engine));
  }
  
  return engine;
}

// 便捷的游戏对象创建函数
export function createSprite(name: string, config: {
  position?: { x: number; y: number };
  spriteId?: string;
  scale?: { x: number; y: number };
  rotation?: number;
}): GameObject {
  const gameObject = new GameObject(name);
  
  if (config.position) {
    gameObject.transform.position.x = config.position.x;
    gameObject.transform.position.y = config.position.y;
  }
  
  if (config.scale) {
    gameObject.transform.scale.x = config.scale.x;
    gameObject.transform.scale.y = config.scale.y;
  }
  
  if (config.rotation !== undefined) {
    gameObject.transform.rotation = config.rotation;
  }
  
  const sprite = gameObject.addComponent(SpriteRenderer);
  if (config.spriteId) {
    sprite.spriteId = config.spriteId;
  }
  
  return gameObject;
}

// 便捷的形状创建函数
export function createShape(name: string, config: {
  position?: { x: number; y: number };
  shape: ShapeType;
  color?: string;
  size?: { width: number; height: number } | { radius: number };
  physics?: boolean;
  isStatic?: boolean;
}): GameObject {
  const gameObject = new GameObject(name);
  
  if (config.position) {
    gameObject.transform.position.x = config.position.x;
    gameObject.transform.position.y = config.position.y;
  }
  
  const renderer = gameObject.addComponent(ShapeRenderer);
  renderer.shapeType = config.shape;
  
  if (config.color) {
    renderer.fillColor = config.color;
  }
  
  if (config.shape === ShapeType.Circle && 'radius' in (config.size || {})) {
    renderer.radius = (config.size as { radius: number }).radius;
    
    if (config.physics) {
      const collider = gameObject.addComponent(CircleCollider);
      collider.radius = renderer.radius;
    }
  } else if ('width' in (config.size || {})) {
    const size = config.size as { width: number; height: number };
    renderer.width = size.width;
    renderer.height = size.height;
    
    if (config.physics) {
      const collider = gameObject.addComponent(BoxCollider);
      collider.width = size.width;
      collider.height = size.height;
    }
  }
  
  if (config.physics && !config.isStatic) {
    gameObject.addComponent(Rigidbody);
  }
  
  return gameObject;
}

// 默认游戏模板
export class GameTemplate {
  protected engine: Engine;
  
  constructor(canvasId: string = 'gameCanvas') {
    this.engine = createGame({
      canvasId,
      onInit: (engine) => this.onInit(engine),
      onStart: (engine) => this.onStart(engine)
    });
  }
  
  protected onInit(engine: Engine): void {
    // 子类实现
  }
  
  protected onStart(engine: Engine): void {
    // 子类实现
  }
  
  start(): void {
    this.engine.start();
  }
  
  stop(): void {
    this.engine.stop();
  }
  
  restart(): void {
    this.engine.restart();
  }
}

// 全局访问（开发调试用）
if (typeof window !== 'undefined') {
  (window as any).GameEngine = {
    Engine,
    GameObject,
    Component,
    Vector2,
    createGame,
    createSprite,
    createShape
  };
  
  console.log('🎮 Game Engine loaded! Access via window.GameEngine');
}