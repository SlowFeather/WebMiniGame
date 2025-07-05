// engine/core/ComponentRegistry.ts
import { Component } from './Component';
import { Transform } from '../components/Transform';
import { ShapeRenderer } from '../components/ShapeRenderer';
import { SpriteRenderer } from '../components/SpriteRenderer';
import { Script } from '../components/Script';
import { ParticleSystem } from '../components/ParticleSystem';

type ComponentConstructor = new () => Component;

class ComponentRegistry {
  private static instance: ComponentRegistry;
  private registry = new Map<string, ComponentConstructor>();
  
  private constructor() {
    // 注册内置组件
    this.registerBuiltinComponents();
  }
  
  static getInstance(): ComponentRegistry {
    if (!this.instance) {
      this.instance = new ComponentRegistry();
    }
    return this.instance;
  }
  
  private registerBuiltinComponents(): void {
    // 注册所有内置组件类型
    this.register('Transform', Transform);
    this.register('ShapeRenderer', ShapeRenderer);
    this.register('SpriteRenderer', SpriteRenderer);
    // this.register('Script', Script);
    this.register('ParticleSystem', ParticleSystem);
    
    // 可以继续添加其他内置组件
  }
  
  // 注册组件类型
  register(typeName: string, constructor: ComponentConstructor): void {
    if (this.registry.has(typeName)) {
      console.warn(`Component type '${typeName}' is already registered, overwriting...`);
    }
    this.registry.set(typeName, constructor);
    console.log(`Registered component type: ${typeName}`);
  }
  
  // 获取组件构造函数
  getConstructor(typeName: string): ComponentConstructor | undefined {
    return this.registry.get(typeName);
  }
  
  // 创建组件实例
  createComponent(typeName: string): Component | null {
    const Constructor = this.registry.get(typeName);
    if (!Constructor) {
      console.error(`Component type '${typeName}' not found in registry`);
      return null;
    }
    return new Constructor();
  }
  
  // 获取所有注册的组件类型
  getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys());
  }
  
  // 检查组件类型是否已注册
  isRegistered(typeName: string): boolean {
    return this.registry.has(typeName);
  }
  
  // 清空注册表（慎用）
  clear(): void {
    this.registry.clear();
    this.registerBuiltinComponents();
  }
}

// 导出单例实例
export const componentRegistry = ComponentRegistry.getInstance();

// 导出便捷函数
export function registerComponent(typeName: string, constructor: ComponentConstructor): void {
  componentRegistry.register(typeName, constructor);
}

export function getComponentConstructor(typeName: string): ComponentConstructor | undefined {
  return componentRegistry.getConstructor(typeName);
}

export function createComponent(typeName: string): Component | null {
  return componentRegistry.createComponent(typeName);
}