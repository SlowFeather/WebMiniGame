import { ComponentSystem } from '../core/ComponentSystem';
import { Script } from '../components/Script';

export class ScriptSystem extends ComponentSystem<Script> {
  private startedScripts = new Set<Script>();

  getComponentTypes(): string[] {
    return ['Script'];
  }
  
  // Script系统在Transform之后，其他系统之前执行
  getPriority(): number {
    return 50;
  }

  update(deltaTime: number, components: Script[]): void {
    for (const script of components) {
      // 调用start方法（只调用一次）
      if (!this.startedScripts.has(script) && script.initialized) {
        try {
          script.start();
          this.startedScripts.add(script);
        } catch (error) {
          console.error(`Error in script start (${script.getTypeName()}):`, error);
        }
      }
      
      // 调用update方法
      if (this.startedScripts.has(script)) {
        try {
          script.update(deltaTime);
        } catch (error) {
          console.error(`Error in script update (${script.getTypeName()}):`, error);
        }
      }
    }
  }

  onDestroy(): void {
    // 调用所有脚本的onDestroy
    for (const script of this.startedScripts) {
      try {
        if (script.onDestroy) {
          script.onDestroy();
        }
      } catch (error) {
        console.error(`Error in script destroy:`, error);
      }
    }
    
    this.startedScripts.clear();
  }
}