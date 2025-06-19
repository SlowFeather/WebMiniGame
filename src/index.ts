// import { runPerformanceTest } from './performanceTest';

// async function main() {
//   try {
//     await runPerformanceTest();
//     console.log('\n✅ 性能测试完成');
//   } catch (error) {
//     console.error('❌ 测试失败:', error);
//   }
// }

// main();



// import { RenderSystem, TransformSystem } from './engine/index';
// import { Engine, GameObject, ShapeRenderer, ShapeType, Script } from './engine/index';

// // 创建自定义脚本
// class PlayerController extends Script {
//   getTypeName() { return 'PlayerController'; }
  
//   start() {
//     console.log('Player started!');
//   }
  
//   update(deltaTime: number) {
//     // 更新逻辑
//   }
// }

// // 初始化游戏
// const engine = Engine.instance;

// // 注册系统
// engine.registerSystem('Transform', new TransformSystem());
// engine.registerSystem('Render', new RenderSystem('gameCanvas'));

// // 创建游戏对象
// const player = new GameObject('Player');
// player.transform.position.x = 100;
// player.transform.position.y = 100;

// // 添加组件
// const renderer = player.addComponent(ShapeRenderer);
// renderer.shapeType = ShapeType.Rectangle;
// renderer.fillColor = '#4CAF50';

// // 添加脚本
// player.addComponent(PlayerController);

// // 启动游戏
// engine.start();

import { Engine } from './engine/core/Engine';
import { GameObject } from './engine/core/GameObject';
import { Vector2 } from './engine/core/Vector2';

// Components
import { Transform } from './engine/components/Transform';
import { ShapeRenderer, ShapeType } from './engine/components/ShapeRenderer';
import { BoxCollider } from './engine/components/BoxCollider';
import { Rigidbody } from './engine/components/Rigidbody';
import { Script } from './engine/components/Script';
import { Button } from './engine/components/Button';
import { Text } from './engine/components/Text';
import { ParticleSystem } from './engine/components/ParticleSystem';
import { AudioSource } from './engine/components/AudioSource';
import { Animator, AnimationClip } from './engine/components/Animator';

// Systems
import { TransformSystem } from './engine/system/TransformSystem';
import { RenderSystem } from './engine/system/RenderSystem';
import { PhysicsSystem } from './engine/system/PhysicsSystem';
import { ScriptSystem } from './engine/system/ScriptSystem';
import { AnimationSystem } from './engine/system/AnimationSystem';
import { AudioSystem } from './engine/system/AudioSystem';
import { UISystem } from './engine/system/UISystem';

import { InputSystem } from './engine/system/InputSystem';

import { Component } from 'engine/core/Component';

// 自定义脚本：玩家控制器
class PlayerController extends Script {
  private speed: number = 300;
  private jumpForce: number = 500;
  private inputSystem!: InputSystem;
  private rigidbody!: Rigidbody;

  getTypeName(): string {
    return 'PlayerController';
  }

  start(): void {
    this.inputSystem = Engine.instance.getSystem<InputSystem>('InputSystem')!;
    this.rigidbody = this.gameObject.getComponent(Rigidbody)!;
  }

  update(deltaTime: number): void {
    const transform = this.gameObject.transform;
    
    // 移动输入
    let moveX = 0;
    if (this.inputSystem.isKeyPressed('KeyA') || this.inputSystem.isKeyPressed('ArrowLeft')) {
      moveX = -1;
    }
    if (this.inputSystem.isKeyPressed('KeyD') || this.inputSystem.isKeyPressed('ArrowRight')) {
      moveX = 1;
    }
    
    // 应用移动
    if (moveX !== 0) {
      this.rigidbody.velocity = new Vector2(moveX * this.speed, this.rigidbody.velocity.y);
    }
    
    // 跳跃
    if ((this.inputSystem.isKeyPressed('Space') || this.inputSystem.isKeyPressed('KeyW')) && 
        Math.abs(this.rigidbody.velocity.y) < 1) {
      this.rigidbody.addImpulse(new Vector2(0, -this.jumpForce));
    }

    console.log("player pos:"+this.gameObject.transform.position);
  }

  onCollisionEnter(other: Component): void {
    console.log('Player collided with:', other.gameObject.name);
  }
}

// 自定义脚本：敌人AI
class EnemyAI extends Script {
  private target: GameObject | null = null;
  private speed: number = 100;
  private detectionRange: number = 200;
  private attackRange: number = 50;
  private lastAttackTime: number = 0;
  private attackCooldown: number = 2000; // 毫秒

  getTypeName(): string {
    return 'EnemyAI';
  }

  start(): void {
    // 寻找玩家
    this.target = Engine.instance.findGameObjectByName('Player') || null;
  }

  update(deltaTime: number): void {
    if (!this.target) return;
    
    const transform = this.gameObject.transform;
    const targetTransform = this.target.transform;
    const distance = Vector2.distance(transform.position, targetTransform.position);
    
    if (distance < this.detectionRange) {
      // 追踪玩家
      const direction = targetTransform.position.subtract(transform.position).normalized;
      transform.velocity = direction.multiply(this.speed);
      
      // 攻击检测
      if (distance < this.attackRange) {
        this.attack();
      }
    } else {
      // 巡逻行为
      transform.velocity = transform.velocity.multiply(0.95);
    }
  }

  private attack(): void {
    const now = Date.now();
    if (now - this.lastAttackTime > this.attackCooldown) {
      this.lastAttackTime = now;
      console.log('Enemy attacks!');
      
      // 创建攻击特效
      const effect = new GameObject('AttackEffect');
      effect.transform.position = this.gameObject.transform.position.clone();
      
      const particles = effect.addComponent(ParticleSystem);
      particles.maxParticles = 20;
      particles.particleLifetime = 0.5;
      particles.startColor = '#ff0000';
      particles.emissionRate = 100;
      
      // 自动销毁特效
      setTimeout(() => effect.destroy(), 1000);
    }
  }
}

// 自定义脚本：收集品
class Collectible extends Script {
  public value: number = 10;
  private collected: boolean = false;

  getTypeName(): string {
    return 'Collectible';
  }

  start(): void {
    // 添加动画
    const animator = this.gameObject.getComponent(Animator);
    if (animator) {
      // 创建旋转动画
      const rotationClip: AnimationClip = {
        name: 'rotate',
        duration: 2,
        loop: true,
        frames: [
          { time: 0, properties: { rotation: 0 } },
          { time: 2, properties: { rotation: 360 } }
        ]
      };
      animator.addClip(rotationClip);
      animator.play('rotate');
    }
  }

  update(deltaTime: number): void {
    // 可以添加浮动效果
    const time = Engine.instance.time.totalTime;
    this.gameObject.transform.position.y += Math.sin(time * 3) * 0.5;
  }

  onTriggerEnter(other: Component): void {
    if (!this.collected && other.gameObject.name === 'Player') {
      this.collected = true;
      
      // 触发收集事件
      Engine.instance.eventSystem.emit('collectible:collected', { value: this.value });
      
      // 播放音效
      const audio = this.gameObject.getComponent(AudioSource);
      if (audio) {
        audio.play();
      }
      
      // 销毁对象
      setTimeout(() => this.gameObject.destroy(), 100);
    }
  }
}

// 游戏管理器
class GameManager {
  private engine: Engine;
  private score: number = 0;
  private scoreText: Text | null = null;

  constructor() {
    this.engine = Engine.instance;
    this.setupGame();
  }

  private async setupGame(): Promise<void> {
    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.appendChild(canvas);
    
    // 注册系统
    this.engine.registerSystem('Transform', new TransformSystem());
    this.engine.registerSystem('RenderSystem', new RenderSystem('gameCanvas'));
    this.engine.registerSystem('Physics', new PhysicsSystem());
    this.engine.registerSystem('Script', new ScriptSystem());
    this.engine.registerSystem('Animation', new AnimationSystem());
    this.engine.registerSystem('Audio', new AudioSystem());
    this.engine.registerSystem('UI', new UISystem());
    this.engine.registerSystem('InputSystem', new InputSystem());
    
    // 加载资源
    await this.loadResources();
    
    // 创建游戏对象
    this.createPlayer();
    this.createEnemies();
    this.createCollectibles();
    this.createEnvironment();
    this.createUI();
    
    // 监听事件
    this.setupEventListeners();
    
    // 启动引擎
    this.engine.start();
  }

  private async loadResources(): Promise<void> {
    // 加载图片资源
    // await this.engine.resourceManager.loadImage('player', 'assets/player.png');
    // await this.engine.resourceManager.loadImage('enemy', 'assets/enemy.png');
    
    // 加载音频资源
    // await this.engine.resourceManager.loadAudio('collect', 'assets/collect.mp3');
    // await this.engine.resourceManager.loadAudio('bgm', 'assets/bgm.mp3');
  }

  private createEnemies(): void {
    for (let i = 0; i < 3; i++) {
      const enemy = new GameObject(`Enemy_${i}`);
      enemy.transform.position = new Vector2(200 + i * 200, 200);
      enemy.tag = 'Enemy';
      
      // 渲染器
      const renderer = enemy.addComponent(ShapeRenderer);
      renderer.shapeType = ShapeType.Circle;
      renderer.fillColor = '#F44336';
      renderer.radius = 25;
      
      // 物理
      const collider = enemy.addComponent(BoxCollider);
      collider.width = 50;
      collider.height = 50;
      
      const rigidbody = enemy.addComponent(Rigidbody);
      rigidbody.mass = 2;
      rigidbody.gravityScale = 1;
      
      // AI脚本
      enemy.addComponent(EnemyAI);
    }
  }

  private createCollectibles(): void {
    const positions = [
      new Vector2(150, 150),
      new Vector2(650, 150),
      new Vector2(400, 100),
      new Vector2(300, 250),
      new Vector2(500, 250)
    ];
    
    positions.forEach((pos, index) => {
      const collectible = new GameObject(`Collectible_${index}`);
      collectible.transform.position = pos;
      collectible.tag = 'Collectible';
      
      // 渲染器
      const renderer = collectible.addComponent(ShapeRenderer);
      renderer.shapeType = ShapeType.Triangle;
      renderer.fillColor = '#FFD700';
      renderer.width = 30;
      renderer.height = 30;
      
      // 触发器碰撞体
      const collider = collectible.addComponent(BoxCollider);
      collider.width = 30;
      collider.height = 30;
      collider.isTrigger = true;
      
      // 动画
      collectible.addComponent(Animator);
      
      // 收集脚本
      const script = collectible.addComponent(Collectible);
      script.value = 10 + index * 5;
    });
  }

  private createEnvironment(): void {
    // 地面
    const ground = new GameObject('Ground');
    ground.transform.position = new Vector2(400, 550);
    
    const groundRenderer = ground.addComponent(ShapeRenderer);
    groundRenderer.shapeType = ShapeType.Rectangle;
    groundRenderer.fillColor = '#8D6E63';
    groundRenderer.width = 800;
    groundRenderer.height = 100;
    
    const groundCollider = ground.addComponent(BoxCollider);
    groundCollider.width = 800;
    groundCollider.height = 100;
    
    // 平台
    const platforms = [
      { x: 200, y: 400, width: 150 },
      { x: 600, y: 400, width: 150 },
      { x: 400, y: 300, width: 200 }
    ];
    
    platforms.forEach((platform, index) => {
      const plat = new GameObject(`Platform_${index}`);
      plat.transform.position = new Vector2(platform.x, platform.y);
      
      const renderer = plat.addComponent(ShapeRenderer);
      renderer.shapeType = ShapeType.Rectangle;
      renderer.fillColor = '#795548';
      renderer.width = platform.width;
      renderer.height = 20;
      
      const collider = plat.addComponent(BoxCollider);
      collider.width = platform.width;
      collider.height = 20;
    });
  }

  private createUI(): void {
    // 分数文本
    const scoreObject = new GameObject('ScoreText');
    scoreObject.transform.position = new Vector2(50, 30);
    
    this.scoreText = scoreObject.addComponent(Text);
    this.scoreText.content = 'Score: 0';
    this.scoreText.fontSize = 24;
    this.scoreText.fontFamily = 'Arial';
    this.scoreText.color = '#ffffff';
    this.scoreText.align = 'left';
    this.scoreText.width = 200;
    this.scoreText.height = 40;
    
    // 重启按钮
    const restartButton = new GameObject('RestartButton');
    restartButton.transform.position = new Vector2(700, 30);
    
    const button = restartButton.addComponent(Button);
    button.text = 'Restart';
    button.width = 100;
    button.height = 40;
    button.onClick = () => {
      this.restartGame();
    };
    
    // 操作说明
    const instructions = new GameObject('Instructions');
    instructions.transform.position = new Vector2(400, 580);
    
    const instructText = instructions.addComponent(Text);
    instructText.content = 'Use A/D or Arrow Keys to move, W/Space to jump';
    instructText.fontSize = 14;
    instructText.color = '#ffffff';
    instructText.width = 400;
    instructText.height = 30;
  }

  private setupEventListeners(): void {
    // 收集品收集事件
    this.engine.eventSystem.on('collectible:collected', (data: { value: number; }) => {
      this.score += data.value;
      this.updateScore();
      
      // 检查胜利条件
      const remainingCollectibles = this.engine.findGameObjectsByTag('Collectible');
      if (remainingCollectibles.length === 0) {
        this.onGameWin();
      }
    });
    
    // 热重载快捷键提示
    console.log('Press Ctrl+R to hot reload the engine');
  }

  private updateScore(): void {
    if (this.scoreText) {
      this.scoreText.setContent(`Score: ${this.score}`);
    }
  }

  private restartGame(): void {
    this.score = 0;
    this.engine.restart();
    
    // 重新设置游戏
    setTimeout(() => {
      this.setupGame();
    }, 100);
  }

  private onGameWin(): void {
    console.log('You Win! Final Score:', this.score);
    
    // 创建胜利文本
    const winText = new GameObject('WinText');
    winText.transform.position = new Vector2(400, 300);
    
    const text = winText.addComponent(Text);
    text.content = `You Win! Score: ${this.score}`;
    text.fontSize = 48;
    text.color = '#4CAF50';
    text.width = 400;
    text.height = 100;
    
    // 创建庆祝粒子效果
    const celebration = new GameObject('Celebration');
    celebration.transform.position = new Vector2(400, 300);
    
    const particles = celebration.addComponent(ParticleSystem);
    particles.maxParticles = 200;
    particles.emissionRate = 100;
    particles.particleLifetime = 2;
    particles.startSize = 5;
    particles.startColor = '#FFD700';
    particles.emissionShape = 'circle';
    particles.emissionRadius = 50;
    particles.gravity = new Vector2(0, -50);
  }



  private createPlayer(): void {
    // 创建玩家游戏对象
    const player = new GameObject('Player');
    player.transform.position = new Vector2(100, 300); // 起始位置
    player.tag = 'Player';
    
    // 添加渲染器 - 使用蓝色矩形表示玩家
    const renderer = player.addComponent(ShapeRenderer);
    renderer.shapeType = ShapeType.Rectangle;
    renderer.fillColor = '#2196F3'; // 蓝色
    renderer.width = 40;
    renderer.height = 60;
    renderer.strokeColor = '#1976D2'; // 深蓝色边框
    renderer.strokeWidth = 2;
    
    // 添加碰撞体
    const collider = player.addComponent(BoxCollider);
    collider.width = 40;
    collider.height = 60;
    collider.isTrigger = false; // 实体碰撞
    
    // 添加刚体物理
    const rigidbody = player.addComponent(Rigidbody);
    rigidbody.mass = 1;
    rigidbody.gravityScale = 1;
    
    // 添加玩家控制脚本
    player.addComponent(PlayerController);
    
    // 可选：添加动画组件（如果需要角色动画）
    const animator = player.addComponent(Animator);
    
    // 创建简单的空闲动画（可选）
    const idleClip: AnimationClip = {
      name: 'idle',
      duration: 2,
      loop: true,
      frames: [
        { time: 0, properties: { scale: { x: 1, y: 1 } } },
        { time: 1, properties: { scale: { x: 1.05, y: 0.95 } } },
        { time: 2, properties: { scale: { x: 1, y: 1 } } }
      ]
    };
    animator.addClip(idleClip);
    animator.play('idle');
    
    // 可选：添加音频组件（用于播放脚步声等）
    const audioSource = player.addComponent(AudioSource);
    // audioSource.audioId = 'playerSteps'; // 如果有音频资源
    audioSource.volume = 0.5;
    audioSource.loop = false;
    
    console.log('Player created at position:', player.transform.position);
  }
}



// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
  // 设置样式
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #1a1a1a;
      font-family: Arial, sans-serif;
    }
    
    #gameCanvas {
      display: block;
      background: linear-gradient(to bottom, #2196F3, #64B5F6);
    }
    
    button {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 10px 20px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    
    button:hover {
      background-color: #45a049;
    }
    
    #game-ui-container > * {
      pointer-events: auto;
    }
  `;
  document.head.appendChild(style);
  
  // 创建游戏
  new GameManager();
});
