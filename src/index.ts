import { Engine } from './engine/core/Engine';
import { GameObject } from './engine/core/GameObject';
import { Vector2 } from './engine/core/Vector2';

// Components
import { Transform } from './engine/components/Transform';
import { ShapeRenderer, ShapeType } from './engine/components/ShapeRenderer';
import { BoxCollider } from './engine/components/BoxCollider';
import { Rigidbody } from './engine/components/Rigidbody';
import { Script } from './engine/components/Script';

// Systems
import { TransformSystem } from './engine/system/TransformSystem';
import { RenderSystem } from './engine/system/RenderSystem';  // 取消注释
import { PhysicsSystem } from './engine/system/PhysicsSystem';
import { ScriptSystem } from './engine/system/ScriptSystem';
import { InputSystem } from './engine/system/InputSystem';

import { Component } from 'engine/core/Component';

// 简单的测试脚本组件
class TestScript extends Script {
  private rotationSpeed = 180; // 度/秒

  start(): void {
    console.log('TestScript started for:', this.gameObject.name);
  }
  
  getTypeName(): string {
    return "Script"
  }

  update(deltaTime: number): void {
    const transform = this.gameObject.getComponent(Transform);
    if (transform) {
      // 旋转对象
      transform.rotation += this.rotationSpeed * deltaTime;
    }
  }
}

// 游戏管理器
class GameManager {
  private engine: Engine;

  constructor() {
    this.engine = Engine.instance;
    this.setupGame();
  }

  private async setupGame(): Promise<void> {
    console.log('=== Starting Game Setup ===');
    
    // 检查canvas
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas not found!');
      return;
    }
    
    // 设置canvas尺寸
    canvas.width = 800;
    canvas.height = 600;
    
    console.log('Canvas found and configured:', canvas);
    
    // 注册系统
    console.log('Registering systems...');
    this.engine.registerSystem('Transform', new TransformSystem());
    // this.engine.registerSystem('Render', new RenderSystem('gameCanvas')); // 注册渲染系统
    this.engine.registerSystem('Render', new RenderSystem('gameCanvas'));
    this.engine.registerSystem('Physics', new PhysicsSystem());
    this.engine.registerSystem('Input', new InputSystem());
    this.engine.registerSystem('Script', new ScriptSystem());
    
    console.log('Systems registered');
    
    // 创建测试游戏对象
    this.createTestObjects();
    
    // 等待一帧
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // 启动引擎
    console.log('Starting engine...');
    this.engine.start();
    
    console.log('=== Game Setup Complete ===');
  }

  private createTestObjects(): void {
    console.log('Creating test objects...');

    // 创建一个旋转的立方体
    const cube = new GameObject('RotatingCube');
    
    // 设置立方体位置
    cube.transform.position = new Vector2(400, 300);
    console.log('Cube transform set:', cube.transform.position);
    
    // 添加形状渲染器组件
    const shapeRenderer = cube.addComponent(ShapeRenderer);
    shapeRenderer.shapeType = ShapeType.Rectangle;
    shapeRenderer.width = 80;  // 立方体宽度
    shapeRenderer.height = 80; // 立方体高度
    shapeRenderer.fillColor = '#4a90e2'; // 蓝色填充
    shapeRenderer.strokeColor = '#ffffff'; // 白色边框
    shapeRenderer.strokeWidth = 3;

    // 添加旋转脚本
    const rotationScript = cube.addComponent(TestScript);
    console.log('Rotation script added:', rotationScript.getTypeName());
    
    console.log('Test objects created');


  }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== DOM Loaded ===');
  
  // 基础样式
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 20px;
      background-color: #1a1a1a;
      font-family: Arial, sans-serif;
      color: white;
    }
    
    #container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    #gameCanvas {
      border: 2px solid #333;
      margin-bottom: 10px;
      background-color: #2a2a2a;
    }
    
    #gameRoot {
      text-align: center;
      margin-top: 10px;
    }
  `;
  document.head.appendChild(style);
  
  // 添加调试信息显示
  const gameRoot = document.getElementById('gameRoot');
  if (gameRoot) {
    gameRoot.innerHTML = `
      <div id="debugInfo">
        <h3>Engine Debug Info</h3>
        <div id="debugContent">Starting...</div>
        <div style="margin-top: 10px;">
          <button onclick="window.debugEngine()">Debug Engine</button>
          <button onclick="window.restartEngine()">Restart Engine</button>
        </div>
      </div>
    `;
  }
  
  // 启动游戏
  try {
    console.log('Creating GameManager...');
    const gameManager = new GameManager();
    
    // 添加调试功能
    (window as any).debugEngine = () => {
      const debugInfo = Engine.instance.getDebugInfo();
      const debugContent = document.getElementById('debugContent');
      if (debugContent) {
        debugContent.innerHTML = `
          <pre style="text-align: left; background: #333; padding: 10px; border-radius: 5px; font-size: 12px;">
Running: ${debugInfo.running}
Systems: ${debugInfo.systems.join(', ')}
GameObjects: ${debugInfo.gameObjects}
Components: ${JSON.stringify(debugInfo.componentStats, null, 2)}
FPS: ${debugInfo.time.fps}
Total Time: ${debugInfo.time.totalTime.toFixed(2)}s
          </pre>
        `;
      }
    };
    
    (window as any).restartEngine = () => {
      Engine.instance.restart();
    };
    
    // 定期更新调试信息
    setInterval(() => {
      (window as any).debugEngine();
    }, 1000);
    
  } catch (error) {
    console.error('Failed to start game:', error);
    const gameRoot = document.getElementById('gameRoot');
    if (gameRoot) {
      gameRoot.innerHTML = `<div style="color: red;">Game failed to start: ${error}</div>`;
    }
  }
});