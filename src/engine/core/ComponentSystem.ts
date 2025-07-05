// engine/core/ComponentSystem.ts
import { Component } from './Component';

export abstract class ComponentSystem<T extends Component = Component> {
  // 声明此系统处理的组件类型
  abstract getComponentTypes(): string[];
  
  // 更新方法，现在是类型安全的
  abstract update(deltaTime: number, components: T[]): void;
  
  // 生命周期方法
  onInit(): void {}
  onDestroy(): void {}
  
  // 系统优先级（数值越小优先级越高）
  getPriority(): number {
    return 100;
  }
  
  // 性能统计
  private _lastUpdateTime: number = 0;
  private _totalUpdateTime: number = 0;
  private _updateCount: number = 0;
  
  // 包装更新方法以添加性能统计
  performUpdate(deltaTime: number, components: Component[]): void {
    const startTime = performance.now();
    this.update(deltaTime, components as T[]);
    const endTime = performance.now();
    
    this._lastUpdateTime = endTime - startTime;
    this._totalUpdateTime += this._lastUpdateTime;
    this._updateCount++;
  }
  
  // 获取性能统计
  getPerformanceStats() {
    return {
      lastUpdateTime: this._lastUpdateTime,
      averageUpdateTime: this._updateCount > 0 ? this._totalUpdateTime / this._updateCount : 0,
      totalUpdateTime: this._totalUpdateTime,
      updateCount: this._updateCount
    };
  }
  
  resetStats(): void {
    this._lastUpdateTime = 0;
    this._totalUpdateTime = 0;
    this._updateCount = 0;
  }
}