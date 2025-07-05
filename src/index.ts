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
    
    // 设置canvas尺寸为全屏
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    console.log('Canvas found and configured:', canvas);
    
    // 添加窗口大小变化监听器
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
    });
    
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

    // 获取canvas尺寸
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const centerX = canvas ? canvas.width / 2 : window.innerWidth / 2;
    const centerY = canvas ? canvas.height / 2 : window.innerHeight / 2;
    
    console.log('Canvas dimensions:', canvas?.width, 'x', canvas?.height);
    console.log('Center position will be:', centerX, centerY);

    // 创建一个旋转的立方体
    const cube = new GameObject('RotatingCube');
    
    // 设置立方体位置到屏幕中心
    // Canvas坐标系(0,0)在页面中心，所以真正的中心就是(0,0)
    cube.transform.position = new Vector2(0, 0);
    console.log('Cube transform set to canvas center (0,0):', cube.transform.position);
    console.log('Canvas coordinate system: (0,0) = page center');
    
    // 添加形状渲染器组件
    const shapeRenderer = cube.addComponent(ShapeRenderer);
    shapeRenderer.shapeType = ShapeType.Rectangle;
    shapeRenderer.width = 120;  // 更大的立方体宽度
    shapeRenderer.height = 120; // 更大的立方体高度
    shapeRenderer.fillColor = '#ff4444'; // 明亮的红色填充
    shapeRenderer.strokeColor = '#ffffff'; // 白色边框
    shapeRenderer.strokeWidth = 5;

    // 添加旋转脚本
    const rotationScript = cube.addComponent(TestScript);
    console.log('Rotation script added:', rotationScript.getTypeName());
    
    // 验证cube是否正确创建和设置
    console.log('Cube created with:');
    console.log('  - Position:', cube.transform.position);
    console.log('  - Renderer size:', shapeRenderer.width, 'x', shapeRenderer.height);
    console.log('  - Renderer color:', shapeRenderer.fillColor);
    console.log('  - Components:', cube.getComponent(ShapeRenderer) ? 'ShapeRenderer ✓' : 'ShapeRenderer ✗');
    
    console.log('Test objects created');


  }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== DOM Loaded ===');
  
  // 全屏样式
  const style = document.createElement('style');
  style.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      height: 100%;
      overflow: hidden;
      background-color: #1a1a1a;
      font-family: Arial, sans-serif;
      color: white;
    }
    
    #container {
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    #gameCanvas {
      display: block;
      background-color: #2a2a2a;
    }
    
    #gameRoot {
      display: none;
    }
  `;
  document.head.appendChild(style);
  
  // Clear the game root - no HTML debug display needed
  const gameRoot = document.getElementById('gameRoot');
  if (gameRoot) {
    gameRoot.innerHTML = '';
  }
  
  // 启动游戏
  try {
    console.log('Creating GameManager...');
    const gameManager = new GameManager();
    
    // 添加调试功能 - 输出到控制台
    (window as any).debugEngine = () => {
      const debugInfo = Engine.instance.getDebugInfo();
      console.group('🎮 Engine Debug Info');
      console.log('Running:', debugInfo.running);
      console.log('Systems:', debugInfo.systems.join(', '));
      console.log('GameObjects:', debugInfo.gameObjects);
      console.log('Components:', debugInfo.componentStats);
      console.log('FPS:', debugInfo.time.fps);
      console.log('Total Time:', debugInfo.time.totalTime.toFixed(2) + 's');
      console.groupEnd();
    };
    
    (window as any).restartEngine = () => {
      Engine.instance.restart();
    };
    
    // 定期输出调试信息到控制台 (每5秒)
    setInterval(() => {
      (window as any).debugEngine();
    }, 5000);
    
  } catch (error) {
    console.error('Failed to start game:', error);
  }
});