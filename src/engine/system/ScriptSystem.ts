import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';
import { Script } from '../components/Script';

export class ScriptSystem extends ComponentSystem {
  private startedScripts = new Set<Script>();

  update(deltaTime: number, components: Component[]): void {
    const scripts = components.filter(c => c.enabled) as Script[];
    
    for (const script of scripts) {
      // 调用start方法（只调用一次）
      if (!this.startedScripts.has(script)) {
        script.start();
        this.startedScripts.add(script);
      }
      
      // 调用update方法
      script.update(deltaTime);
    }
  }

  onDestroy(): void {
    this.startedScripts.clear();
  }
}