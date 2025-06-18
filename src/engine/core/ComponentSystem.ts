// engine/core/ComponentSystem.ts
import { Component } from './Component';

export abstract class ComponentSystem {
  abstract update(deltaTime: number, components: Component[]): void;
  
  // 生命周期方法
  onInit(): void {}
  onDestroy(): void {}
}