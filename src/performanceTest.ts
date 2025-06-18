// performanceTest.ts
// 使用浏览器原生 Performance API
const performance = window.performance || {
  now: () => Date.now()
} as Performance;

// -------------------------------------
// 消息系统
// -------------------------------------
export interface Message {
  type: string;
  data: any;
  sender?: Component;
  timestamp: number;
}

export class MessageBus {
  private static _instance: MessageBus;
  private listeners = new Map<string, Array<(msg: Message) => void>>();
  private messageQueue: Message[] = [];
  private processingQueue = false;

  static get instance() {
    if (!this._instance) this._instance = new MessageBus();
    return this._instance;
  }

  subscribe(messageType: string, callback: (msg: Message) => void) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }
    this.listeners.get(messageType)!.push(callback);
  }

  unsubscribe(messageType: string, callback: (msg: Message) => void) {
    const callbacks = this.listeners.get(messageType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  publish(message: Message) {
    this.messageQueue.push(message);
    if (!this.processingQueue) {
      this.processQueue();
    }
  }

  private processQueue() {
    this.processingQueue = true;
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      const callbacks = this.listeners.get(message.type);
      if (callbacks) {
        callbacks.forEach(callback => callback(message));
      }
    }
    this.processingQueue = false;
  }

  clear() {
    this.listeners.clear();
    this.messageQueue = [];
  }
}

// -------------------------------------
// 公共基类增强：Component
// -------------------------------------
export abstract class Component {
  public gameObject!: { id: number; addComponent(c: Component): any; getComponent<T extends Component>(type: new() => T): T | null };
  public enabled: boolean = true;
  public isDestroyed: boolean = false;
  protected messageBus = MessageBus.instance;
  protected messageCallbacks = new Map<string, (msg: Message) => void>();

  abstract getTypeName(): string;
  onInit(): void {}
  update(dt: number): void {}
  
  destroy(): void {
    // 清理消息监听
    this.messageCallbacks.forEach((callback, type) => {
      this.messageBus.unsubscribe(type, callback);
    });
    this.messageCallbacks.clear();
    this.isDestroyed = true;
  }

  protected subscribeToMessage(messageType: string, callback: (msg: Message) => void) {
    this.messageBus.subscribe(messageType, callback);
    this.messageCallbacks.set(messageType, callback);
  }

  protected publishMessage(type: string, data: any) {
    this.messageBus.publish({
      type,
      data,
      sender: this,
      timestamp: performance.now()
    });
  }
}

// -------------------------------------
// 数学工具和AI行为
// -------------------------------------
export class MathUtils {
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  static randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export enum AIState {
  IDLE,
  PATROL,
  CHASE,
  ATTACK,
  FLEE
}

// -------------------------------------
// 第一种：EngineA 驱动 GameObjectA - 增强版
// -------------------------------------
export class TransformA extends Component {
  public x = 0;
  public y = 0;
  public rotation = 0;
  public scale = 1;
  public velocity = { x: 0, y: 0 };
  public angularVelocity = 0;
  
  getTypeName() { return 'TransformA'; }
  
  onInit(): void {
    this.subscribeToMessage('move_to', (msg) => {
      if (msg.data.targetId === this.gameObject.id) {
        this.moveTo(msg.data.x, msg.data.y);
      }
    });
  }

  update(dt: number): void {
    // 物理更新
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;
    this.rotation += this.angularVelocity * dt;
    
    // 阻尼
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    this.angularVelocity *= 0.95;
    
    // 边界检查
    if (this.x < -100 || this.x > 100) this.velocity.x *= -1;
    if (this.y < -100 || this.y > 100) this.velocity.y *= -1;
    
    // 发送位置更新消息
    if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
      this.publishMessage('position_changed', {
        id: this.gameObject.id,
        x: this.x,
        y: this.y,
        rotation: this.rotation
      });
    }
  }

  moveTo(targetX: number, targetY: number) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0.1) {
      this.velocity.x = (dx / distance) * 50;
      this.velocity.y = (dy / distance) * 50;
    }
  }
}

export class MeshRendererA extends Component {
  public visible = true;
  public color = 0xffffff;
  public opacity = 1.0;
  public renderLayer = 0;
  private animationTime = 0;
  
  getTypeName() { return 'MeshRendererA'; }
  
  onInit(): void {
    this.subscribeToMessage('set_color', (msg) => {
      if (msg.data.targetId === this.gameObject.id) {
        this.color = msg.data.color;
      }
    });
    
    this.subscribeToMessage('flash_effect', (msg) => {
      if (msg.data.targetId === this.gameObject.id) {
        this.startFlash();
      }
    });
  }
  
  update(dt: number): void {
    this.animationTime += dt;
    
    // 复杂渲染逻辑模拟
    if (this.visible) {
      // 模拟光照计算
      const lightIntensity = Math.sin(this.animationTime * 2) * 0.5 + 0.5;
      
      // 模拟材质属性动画
      const colorShift = Math.sin(this.animationTime) * 0.1;
      
      // 模拟阴影计算
      const shadowOffset = Math.cos(this.animationTime * 0.5) * 2;
      
      // 模拟LOD计算
      const transform = this.gameObject.getComponent(TransformA);
      if (transform) {
        const distance = Math.sqrt(transform.x * transform.x + transform.y * transform.y);
        this.renderLayer = distance > 50 ? 1 : 0;
      }
      
      // 浮点运算密集操作
      const _ = Math.sin(this.color + lightIntensity + colorShift + shadowOffset);
    }
  }

  private startFlash() {
    const originalColor = this.color;
    this.color = 0xff0000;
    setTimeout(() => {
      this.color = originalColor;
    }, 100);
  }
}

export class AIBehaviorA extends Component {
  public state = AIState.IDLE;
  public targetId: number | null = null;
  public patrolPoints: Array<{x: number, y: number}> = [];
  public currentPatrolIndex = 0;
  public attackRange = 20;
  public detectionRange = 50;
  public health = 100;
  public maxHealth = 100;
  private stateTimer = 0;
  private lastAttackTime = 0;
  
  getTypeName() { return 'AIBehaviorA'; }
  
  onInit(): void {
    // 生成随机巡逻点
    for (let i = 0; i < 4; i++) {
      this.patrolPoints.push({
        x: MathUtils.randomRange(-80, 80),
        y: MathUtils.randomRange(-80, 80)
      });
    }
    
    this.subscribeToMessage('position_changed', (msg) => {
      this.onOtherObjectMoved(msg.data);
    });
    
    this.subscribeToMessage('take_damage', (msg) => {
      if (msg.data.targetId === this.gameObject.id) {
        this.takeDamage(msg.data.damage);
      }
    });
  }
  
  update(dt: number): void {
    this.stateTimer += dt;
    
    switch (this.state) {
      case AIState.IDLE:
        this.updateIdleState(dt);
        break;
      case AIState.PATROL:
        this.updatePatrolState(dt);
        break;
      case AIState.CHASE:
        this.updateChaseState(dt);
        break;
      case AIState.ATTACK:
        this.updateAttackState(dt);
        break;
      case AIState.FLEE:
        this.updateFleeState(dt);
        break;
    }
    
    // 健康检查
    if (this.health < this.maxHealth * 0.3 && this.state !== AIState.FLEE) {
      this.changeState(AIState.FLEE);
    }
  }
  
  private updateIdleState(dt: number) {
    if (this.stateTimer > 2) {
      this.changeState(AIState.PATROL);
    }
  }
  
  private updatePatrolState(dt: number) {
    const transform = this.gameObject.getComponent(TransformA);
    if (!transform) return;
    
    const target = this.patrolPoints[this.currentPatrolIndex];
    const distance = MathUtils.distance(transform.x, transform.y, target.x, target.y);
    
    if (distance < 5) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      this.publishMessage('move_to', {
        targetId: this.gameObject.id,
        x: target.x,
        y: target.y
      });
    }
  }
  
  private updateChaseState(dt: number) {
    if (this.targetId === null) {
      this.changeState(AIState.PATROL);
      return;
    }
    
    const transform = this.gameObject.getComponent(TransformA);
    if (!transform) return;
    
    // 模拟找到目标位置
    const targetX = MathUtils.randomRange(-50, 50);
    const targetY = MathUtils.randomRange(-50, 50);
    const distance = MathUtils.distance(transform.x, transform.y, targetX, targetY);
    
    if (distance < this.attackRange) {
      this.changeState(AIState.ATTACK);
    } else {
      this.publishMessage('move_to', {
        targetId: this.gameObject.id,
        x: targetX,
        y: targetY
      });
    }
  }
  
  private updateAttackState(dt: number) {
    const now = performance.now();
    if (now - this.lastAttackTime > 1000) { // 1秒攻击间隔
      this.performAttack();
      this.lastAttackTime = now;
    }
    
    if (this.stateTimer > 3) {
      this.changeState(AIState.PATROL);
    }
  }
  
  private updateFleeState(dt: number) {
    const transform = this.gameObject.getComponent(TransformA);
    if (!transform) return;
    
    // 逃跑到安全区域
    const safeX = transform.x > 0 ? -80 : 80;
    const safeY = transform.y > 0 ? -80 : 80;
    
    this.publishMessage('move_to', {
      targetId: this.gameObject.id,
      x: safeX,
      y: safeY
    });
    
    if (this.stateTimer > 5) {
      this.health = Math.min(this.maxHealth, this.health + 20);
      this.changeState(AIState.PATROL);
    }
  }
  
  private changeState(newState: AIState) {
    this.state = newState;
    this.stateTimer = 0;
    
    this.publishMessage('ai_state_changed', {
      id: this.gameObject.id,
      oldState: this.state,
      newState: newState
    });
  }
  
  private onOtherObjectMoved(data: any) {
    if (data.id === this.gameObject.id) return;
    
    const transform = this.gameObject.getComponent(TransformA);
    if (!transform) return;
    
    const distance = MathUtils.distance(transform.x, transform.y, data.x, data.y);
    
    if (distance < this.detectionRange && this.state === AIState.PATROL) {
      this.targetId = data.id;
      this.changeState(AIState.CHASE);
    }
  }
  
  private performAttack() {
    this.publishMessage('attack_performed', {
      attackerId: this.gameObject.id,
      targetId: this.targetId,
      damage: MathUtils.randomRange(10, 20)
    });
    
    this.publishMessage('flash_effect', {
      targetId: this.gameObject.id
    });
  }
  
  private takeDamage(damage: number) {
    this.health = Math.max(0, this.health - damage);
    
    if (this.health <= 0) {
      this.publishMessage('entity_destroyed', {
        id: this.gameObject.id
      });
    }
  }
}

export class GameObjectA {
  public id: number;
  private static _count = 0;
  private components: Component[] = [];
  public children: GameObjectA[] = [];
  public parent: GameObjectA | null = null;
  public isActive = true;
  public tag = '';

  constructor(public name: string) {
    this.id = GameObjectA._count++;
    this.addComponent(new TransformA());
  }

  addComponent<T extends Component>(comp: T): T {
    comp.gameObject = this as any;
    this.components.push(comp);
    comp.onInit();
    return comp;
  }

  getComponent<T extends Component>(type: new() => T): T | null {
    return this.components.find(c => c instanceof type) as T || null;
  }

  getComponents<T extends Component>(type: new() => T): T[] {
    return this.components.filter(c => c instanceof type) as T[];
  }

  update(dt: number) {
    if (!this.isActive) return;
    
    for (const c of this.components) {
      if (c.enabled && !c.isDestroyed) {
        c.update(dt);
      }
    }
    
    for (const ch of this.children) {
      ch.update(dt);
    }
  }

  destroy() {
    for (const c of this.components) {
      c.destroy();
    }
    this.components.length = 0;
    this.children.length = 0;
  }
}

export class EngineA {
  private static _inst: EngineA;
  private lastTime = 0;
  private gameObjects = new Set<GameObjectA>();
  private running = false;

  private constructor() {}

  static get instance() {
    if (!this._inst) this._inst = new EngineA();
    return this._inst;
  }

  addGameObject(go: GameObjectA) {
    this.gameObjects.add(go);
  }

  removeGameObject(go: GameObjectA) {
    this.gameObjects.delete(go);
  }

  getGameObjectCount(): number {
    return this.gameObjects.size;
  }

  public step() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    for (const go of this.gameObjects) {
      go.update(dt);
    }
  }

  public initTimer() {
    this.lastTime = performance.now();
  }

  public clear() {
    for (const go of this.gameObjects) {
      go.destroy();
    }
    this.gameObjects.clear();
    MessageBus.instance.clear();
  }
}

// -------------------------------------
// 第二种：EngineB 批量驱动 Component - 增强版
// -------------------------------------
export interface ComponentSystem {
  update(dt: number, comps: Component[]): void;
}

export class TransformB extends Component {
  public x = 0;
  public y = 0;
  public rotation = 0;
  public scale = 1;
  public velocity = { x: 0, y: 0 };
  public angularVelocity = 0;
  
  getTypeName() { return 'TransformB'; }
}

export class MeshRendererB extends Component {
  public visible = true;
  public color = 0xffffff;
  public opacity = 1.0;
  public renderLayer = 0;
  public animationTime = 0;
  
  getTypeName() { return 'MeshRendererB'; }
}

export class AIBehaviorB extends Component {
  public state = AIState.IDLE;
  public targetId: number | null = null;
  public patrolPoints: Array<{x: number, y: number}> = [];
  public currentPatrolIndex = 0;
  public attackRange = 20;
  public detectionRange = 50;
  public health = 100;
  public maxHealth = 100;
  public stateTimer = 0;
  public lastAttackTime = 0;
  
  getTypeName() { return 'AIBehaviorB'; }
  
  onInit(): void {
    for (let i = 0; i < 4; i++) {
      this.patrolPoints.push({
        x: MathUtils.randomRange(-80, 80),
        y: MathUtils.randomRange(-80, 80)
      });
    }
  }
}

export class TransformSystemB implements ComponentSystem {
  update(dt: number, comps: Component[]) {
    const transforms = comps as TransformB[];
    
    for (const t of transforms) {
      // 物理更新
      t.x += t.velocity.x * dt;
      t.y += t.velocity.y * dt;
      t.rotation += t.angularVelocity * dt;
      
      // 阻尼
      t.velocity.x *= 0.95;
      t.velocity.y *= 0.95;
      t.angularVelocity *= 0.95;
      
      // 边界检查
      if (t.x < -100 || t.x > 100) t.velocity.x *= -1;
      if (t.y < -100 || t.y > 100) t.velocity.y *= -1;
    }
  }
}

export class RenderSystemB implements ComponentSystem {
  update(dt: number, comps: Component[]) {
    const renderers = comps as MeshRendererB[];
    
    for (const r of renderers) {
      r.animationTime += dt;
      
      if (r.visible) {
        // 模拟复杂渲染计算
        const lightIntensity = Math.sin(r.animationTime * 2) * 0.5 + 0.5;
        const colorShift = Math.sin(r.animationTime) * 0.1;
        const shadowOffset = Math.cos(r.animationTime * 0.5) * 2;
        
        // 浮点运算密集操作
        const _ = Math.sin(r.color + lightIntensity + colorShift + shadowOffset);
      }
    }
  }
}

export class AISystemB implements ComponentSystem {
  private transforms: TransformB[] = [];
  
  setTransforms(transforms: TransformB[]) {
    this.transforms = transforms;
  }
  
  update(dt: number, comps: Component[]) {
    const aiComponents = comps as AIBehaviorB[];
    
    for (let i = 0; i < aiComponents.length; i++) {
      const ai = aiComponents[i];
      const transform = this.transforms[i]; // 假设索引对应
      
      if (!transform) continue;
      
      ai.stateTimer += dt;
      
      switch (ai.state) {
        case AIState.IDLE:
          if (ai.stateTimer > 2) {
            ai.state = AIState.PATROL;
            ai.stateTimer = 0;
          }
          break;
          
        case AIState.PATROL:
          const target = ai.patrolPoints[ai.currentPatrolIndex];
          const distance = MathUtils.distance(transform.x, transform.y, target.x, target.y);
          
          if (distance < 5) {
            ai.currentPatrolIndex = (ai.currentPatrolIndex + 1) % ai.patrolPoints.length;
          } else {
            const dx = target.x - transform.x;
            const dy = target.y - transform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.1) {
              transform.velocity.x = (dx / dist) * 50;
              transform.velocity.y = (dy / dist) * 50;
            }
          }
          break;
          
        case AIState.CHASE:
          // 简化的追逐逻辑
          const targetX = MathUtils.randomRange(-50, 50);
          const targetY = MathUtils.randomRange(-50, 50);
          const chaseDistance = MathUtils.distance(transform.x, transform.y, targetX, targetY);
          
          if (chaseDistance < ai.attackRange) {
            ai.state = AIState.ATTACK;
            ai.stateTimer = 0;
          } else {
            const dx2 = targetX - transform.x;
            const dy2 = targetY - transform.y;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist2 > 0.1) {
              transform.velocity.x = (dx2 / dist2) * 70;
              transform.velocity.y = (dy2 / dist2) * 70;
            }
          }
          break;
          
        case AIState.ATTACK:
          if (ai.stateTimer > 3) {
            ai.state = AIState.PATROL;
            ai.stateTimer = 0;
          }
          break;
          
        case AIState.FLEE:
          const safeX = transform.x > 0 ? -80 : 80;
          const safeY = transform.y > 0 ? -80 : 80;
          
          const dx3 = safeX - transform.x;
          const dy3 = safeY - transform.y;
          const dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3);
          if (dist3 > 0.1) {
            transform.velocity.x = (dx3 / dist3) * 60;
            transform.velocity.y = (dy3 / dist3) * 60;
          }
          
          if (ai.stateTimer > 5) {
            ai.health = Math.min(ai.maxHealth, ai.health + 20);
            ai.state = AIState.PATROL;
            ai.stateTimer = 0;
          }
          break;
      }
      
      // 健康检查
      if (ai.health < ai.maxHealth * 0.3 && ai.state !== AIState.FLEE) {
        ai.state = AIState.FLEE;
        ai.stateTimer = 0;
      }
    }
  }
}

export class EngineB {
  private static _inst: EngineB;
  private systems = new Map<string, ComponentSystem>();
  private compMap = new Map<string, Component[]>();
  private lastTime = 0;
  private aiSystem = new AISystemB();

  private constructor() {}

  static getInstance() {
    if (!this._inst) this._inst = new EngineB();
    return this._inst;
  }

  registerSystem(typeName: string, sys: ComponentSystem) {
    this.systems.set(typeName, sys);
    this.compMap.set(typeName, []);
  }

  registerComponent(c: Component) {
    const name = c.getTypeName();
    const arr = this.compMap.get(name);
    if (arr) {
      arr.push(c);
    }
  }

  getComponentCount(typeName: string): number {
    return this.compMap.get(typeName)?.length || 0;
  }

  step() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    // 更新AI系统时传递Transform数据
    const transforms = this.compMap.get('TransformB') as TransformB[];
    if (transforms) {
      this.aiSystem.setTransforms(transforms);
    }
    
    for (const [typeName, sys] of this.systems) {
      const comps = this.compMap.get(typeName)!;
      if (comps.length > 0) {
        sys.update(dt, comps);
      }
    }
  }

  initTimer() {
    this.lastTime = performance.now();
  }

  clear() {
    for (const [_, comps] of this.compMap) {
      comps.length = 0;
    }
    MessageBus.instance.clear();
  }
}

// -------------------------------------
// 性能测试工具类 - 增强版
// -------------------------------------
export interface TestResult {
  name: string;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
  objectCount: number;
  memoryUsage?: number;
  messageCount?: number;
}

export class PerformanceTester {
  private results: TestResult[] = [];
  private messageCount = 0;

  async testEngineA(objectCount: number, iterations: number): Promise<TestResult> {
    const engine = EngineA.instance;
    engine.clear();
    this.messageCount = 0;

    // 监听消息数量
    const messageBus = MessageBus.instance;
    const originalPublish = messageBus.publish.bind(messageBus);
    messageBus.publish = (message: Message) => {
      this.messageCount++;
      return originalPublish(message);
    };

    console.log(`创建 ${objectCount} 个增强版 GameObjectA...`);
    
    // 创建不同类型的游戏对象
    for (let i = 0; i < objectCount; i++) {
      const go = new GameObjectA(`GameObject_${i}`);
      go.addComponent(new MeshRendererA());
      
      // 50% 的对象有AI行为
      if (Math.random() < 0.5) {
        go.addComponent(new AIBehaviorA());
        go.tag = 'AI';
      }
      
      engine.addGameObject(go);
    }

    // 记录初始内存
    const initialMemory = this.getMemoryUsage();
    
    engine.initTimer();
    
    const times: number[] = [];
    console.log(`开始增强版 EngineA 性能测试 (${iterations} 次迭代)...`);
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      engine.step();
      const end = performance.now();
      times.push(end - start);
      
      if (i % 100 === 0) {
        console.log(`EngineA 进度: ${i}/${iterations} (消息数: ${this.messageCount})`);
      }
    }

    const finalMemory = this.getMemoryUsage();

    const result: TestResult = {
      name: 'EngineA Enhanced',
      totalTime: times.reduce((a, b) => a + b, 0),
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      objectCount,
      memoryUsage: finalMemory - initialMemory,
      messageCount: this.messageCount
    };

    this.results.push(result);
    engine.clear();
    return result;
  }

  async testEngineB(objectCount: number, iterations: number): Promise<TestResult> {
    const engine = EngineB.getInstance();
    engine.clear();

    // 注册增强系统
    engine.registerSystem('TransformB', new TransformSystemB());
    engine.registerSystem('MeshRendererB', new RenderSystemB());
    engine.registerSystem('AIBehaviorB', new AISystemB());

    console.log(`创建 ${objectCount} 个增强版 Component...`);
    
    for (let i = 0; i < objectCount; i++) {
      const transform = new TransformB();
      const renderer = new MeshRendererB();
      
      engine.registerComponent(transform);
      engine.registerComponent(renderer);
      
      // 50% 的组件有AI行为
      if (Math.random() < 0.5) {
        const ai = new AIBehaviorB();
        engine.registerComponent(ai);
      }
    }

    // 记录初始内存
    const initialMemory = this.getMemoryUsage();
    
    engine.initTimer();
    
    const times: number[] = [];
    console.log(`开始增强版 EngineB 性能测试 (${iterations} 次迭代)...`);
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      engine.step();
      const end = performance.now();
      times.push(end - start);
      
      if (i % 100 === 0) {
        console.log(`EngineB 进度: ${i}/${iterations}`);
      }
    }

    const finalMemory = this.getMemoryUsage();

    const result: TestResult = {
      name: 'EngineB Enhanced',
      totalTime: times.reduce((a, b) => a + b, 0),
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      objectCount,
      memoryUsage: finalMemory - initialMemory,
      messageCount: 0 // EngineB 不使用消息系统
    };

    this.results.push(result);
    engine.clear();
    return result;
  }

  // 压力测试：模拟游戏场景
  async testGameScenario(objectCount: number, iterations: number): Promise<{engineA: TestResult, engineB: TestResult}> {
    console.log('\n🎮 开始游戏场景压力测试...');
    
    // 测试EngineA游戏场景
    const engineA = EngineA.instance;
    engineA.clear();
    this.messageCount = 0;

    // 创建复杂游戏场景
    const players: GameObjectA[] = [];
    const enemies: GameObjectA[] = [];
    const npcs: GameObjectA[] = [];

    // 创建玩家
    for (let i = 0; i < Math.floor(objectCount * 0.1); i++) {
      const player = new GameObjectA(`Player_${i}`);
      player.addComponent(new MeshRendererA());
      player.addComponent(new AIBehaviorA());
      player.tag = 'Player';
      players.push(player);
      engineA.addGameObject(player);
    }

    // 创建敌人
    for (let i = 0; i < Math.floor(objectCount * 0.4); i++) {
      const enemy = new GameObjectA(`Enemy_${i}`);
      enemy.addComponent(new MeshRendererA());
      const ai = enemy.addComponent(new AIBehaviorA());
      ai.state = AIState.PATROL;
      enemy.tag = 'Enemy';
      enemies.push(enemy);
      engineA.addGameObject(enemy);
    }

    // 创建NPC
    for (let i = 0; i < Math.floor(objectCount * 0.5); i++) {
      const npc = new GameObjectA(`NPC_${i}`);
      npc.addComponent(new MeshRendererA());
      npc.addComponent(new AIBehaviorA());
      npc.tag = 'NPC';
      npcs.push(npc);
      engineA.addGameObject(npc);
    }

    // 模拟游戏事件
    let eventTimer = 0;
    const times: number[] = [];
    engineA.initTimer();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // 每100帧触发一次游戏事件
      if (i % 100 === 0) {
        this.triggerGameEvents(players, enemies);
      }
      
      engineA.step();
      const end = performance.now();
      times.push(end - start);
    }

    const engineAResult: TestResult = {
      name: 'EngineA Game Scenario',
      totalTime: times.reduce((a, b) => a + b, 0),
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      objectCount: engineA.getGameObjectCount(),
      messageCount: this.messageCount
    };

    engineA.clear();

    // 测试EngineB游戏场景
    const engineB = EngineB.getInstance();
    engineB.clear();

    engineB.registerSystem('TransformB', new TransformSystemB());
    engineB.registerSystem('MeshRendererB', new RenderSystemB());
    engineB.registerSystem('AIBehaviorB', new AISystemB());

    // 创建相同数量的组件
    for (let i = 0; i < objectCount; i++) {
      const transform = new TransformB();
      const renderer = new MeshRendererB();
      const ai = new AIBehaviorB();
      
      engineB.registerComponent(transform);
      engineB.registerComponent(renderer);
      engineB.registerComponent(ai);
    }

    const timesB: number[] = [];
    engineB.initTimer();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      engineB.step();
      const end = performance.now();
      timesB.push(end - start);
    }

    const engineBResult: TestResult = {
      name: 'EngineB Game Scenario',
      totalTime: timesB.reduce((a, b) => a + b, 0),
      averageTime: timesB.reduce((a, b) => a + b, 0) / timesB.length,
      minTime: Math.min(...timesB),
      maxTime: Math.max(...timesB),
      iterations,
      objectCount,
      messageCount: 0
    };

    engineB.clear();

    return { engineA: engineAResult, engineB: engineBResult };
  }

  private triggerGameEvents(players: GameObjectA[], enemies: GameObjectA[]) {
    const messageBus = MessageBus.instance;
    
    // 随机攻击事件
    if (Math.random() < 0.3) {
      const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      
      if (randomEnemy && randomPlayer) {
        messageBus.publish({
          type: 'attack_performed',
          data: {
            attackerId: randomEnemy.id,
            targetId: randomPlayer.id,
            damage: MathUtils.randomRange(5, 15)
          },
          timestamp: performance.now()
        });
      }
    }

    // 随机移动指令
    if (Math.random() < 0.5) {
      const randomObject = [...players, ...enemies][Math.floor(Math.random() * (players.length + enemies.length))];
      if (randomObject) {
        messageBus.publish({
          type: 'move_to',
          data: {
            targetId: randomObject.id,
            x: MathUtils.randomRange(-80, 80),
            y: MathUtils.randomRange(-80, 80)
          },
          timestamp: performance.now()
        });
      }
    }

    // 随机颜色变化
    if (Math.random() < 0.2) {
      const randomObject = [...players, ...enemies][Math.floor(Math.random() * (players.length + enemies.length))];
      if (randomObject) {
        messageBus.publish({
          type: 'set_color',
          data: {
            targetId: randomObject.id,
            color: Math.floor(Math.random() * 0xffffff)
          },
          timestamp: performance.now()
        });
      }
    }
  }

  // 内存测试
  async testMemoryUsage(objectCount: number): Promise<{engineA: number, engineB: number}> {
    console.log('\n🧠 开始内存使用测试...');
    
    // 强制垃圾回收
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    const initialMemory = this.getMemoryUsage();
    
    // 测试EngineA内存使用
    const engineA = EngineA.instance;
    engineA.clear();
    
    for (let i = 0; i < objectCount; i++) {
      const go = new GameObjectA(`Test_${i}`);
      go.addComponent(new MeshRendererA());
      go.addComponent(new AIBehaviorA());
      engineA.addGameObject(go);
    }
    
    const engineAMemory = this.getMemoryUsage() - initialMemory;
    engineA.clear();
    
    // 强制垃圾回收
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    // 测试EngineB内存使用
    const engineB = EngineB.getInstance();
    engineB.clear();
    
    engineB.registerSystem('TransformB', new TransformSystemB());
    engineB.registerSystem('MeshRendererB', new RenderSystemB());
    engineB.registerSystem('AIBehaviorB', new AISystemB());
    
    for (let i = 0; i < objectCount; i++) {
      engineB.registerComponent(new TransformB());
      engineB.registerComponent(new MeshRendererB());
      engineB.registerComponent(new AIBehaviorB());
    }
    
    const engineBMemory = this.getMemoryUsage() - initialMemory - engineAMemory;
    engineB.clear();
    
    return { engineA: engineAMemory, engineB: engineBMemory };
  }

  // 运行完整的对比测试
  async runComparison(objectCounts: number[], iterations: number): Promise<void> {
    console.log('='.repeat(80));
    console.log('🚀 开始增强版性能对比测试');
    console.log('='.repeat(80));

    for (const count of objectCounts) {
      console.log(`\n📊 测试对象数量: ${count}`);
      console.log('-'.repeat(50));
      
      // 基础性能测试
      const resultA = await this.testEngineA(count, iterations);
      const resultB = await this.testEngineB(count, iterations);
      
      this.printComparison(resultA, resultB);
      
      // 游戏场景测试
      if (count >= 500) {
        const scenarioResults = await this.testGameScenario(count, Math.floor(iterations / 2));
        console.log('\n🎮 游戏场景测试结果:');
        this.printComparison(scenarioResults.engineA, scenarioResults.engineB);
      }
      
      // 内存使用测试
      if (count >= 1000) {
        const memoryResults = await this.testMemoryUsage(count);
        console.log('\n🧠 内存使用对比:');
        console.log(`EngineA: ${(memoryResults.engineA / 1024 / 1024).toFixed(2)} MB`);
        console.log(`EngineB: ${(memoryResults.engineB / 1024 / 1024).toFixed(2)} MB`);
        
        const memoryRatio = memoryResults.engineA / memoryResults.engineB;
        if (memoryRatio > 1) {
          console.log(`💾 EngineB 内存效率比 EngineA 高 ${memoryRatio.toFixed(2)}x`);
        } else {
          console.log(`💾 EngineA 内存效率比 EngineB 高 ${(1/memoryRatio).toFixed(2)}x`);
        }
      }
    }

    this.printSummary();
  }

  private printComparison(resultA: TestResult, resultB: TestResult): void {
    console.log('\n📈 对比结果:');
    console.log(`${resultA.name}:`);
    console.log(`  平均: ${resultA.averageTime.toFixed(3)}ms`);
    console.log(`  总计: ${resultA.totalTime.toFixed(3)}ms`);
    console.log(`  范围: ${resultA.minTime.toFixed(3)}-${resultA.maxTime.toFixed(3)}ms`);
    if (resultA.messageCount !== undefined) {
      console.log(`  消息: ${resultA.messageCount} 条`);
    }
    
    console.log(`${resultB.name}:`);
    console.log(`  平均: ${resultB.averageTime.toFixed(3)}ms`);
    console.log(`  总计: ${resultB.totalTime.toFixed(3)}ms`);
    console.log(`  范围: ${resultB.minTime.toFixed(3)}-${resultB.maxTime.toFixed(3)}ms`);
    
    const speedup = resultA.averageTime / resultB.averageTime;
    if (speedup > 1) {
      console.log(`🚀 ${resultB.name} 比 ${resultA.name} 快 ${speedup.toFixed(2)}x`);
    } else {
      console.log(`🚀 ${resultA.name} 比 ${resultB.name} 快 ${(1/speedup).toFixed(2)}x`);
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📋 测试总结');
    console.log('='.repeat(80));
    
    const engineAResults = this.results.filter(r => r.name.includes('EngineA'));
    const engineBResults = this.results.filter(r => r.name.includes('EngineB'));
    
    console.log('\n🎯 EngineA 详细结果:');
    engineAResults.forEach(r => {
      console.log(`  ${r.name} - 对象数: ${r.objectCount}, 平均: ${r.averageTime.toFixed(3)}ms`);
      if (r.messageCount) {
        console.log(`    消息数: ${r.messageCount}, 消息/ms: ${(r.messageCount / r.totalTime).toFixed(2)}`);
      }
    });
    
    console.log('\n🎯 EngineB 详细结果:');
    engineBResults.forEach(r => {
      console.log(`  ${r.name} - 对象数: ${r.objectCount}, 平均: ${r.averageTime.toFixed(3)}ms`);
    });

    // 分析性能趋势
    console.log('\n📊 性能趋势分析:');
    const basicAResults = engineAResults.filter(r => r.name === 'EngineA Enhanced');
    const basicBResults = engineBResults.filter(r => r.name === 'EngineB Enhanced');
    
    for (let i = 0; i < Math.min(basicAResults.length, basicBResults.length); i++) {
      const a = basicAResults[i];
      const b = basicBResults[i];
      const ratio = a.averageTime / b.averageTime;
      const winner = ratio > 1 ? 'EngineB' : 'EngineA';
      const advantage = Math.max(ratio, 1/ratio);
      
      console.log(`  ${a.objectCount} 对象: ${winner} 领先 ${advantage.toFixed(2)}x`);
    }

    // 推荐使用场景
    console.log('\n💡 使用建议:');
    const avgSpeedup = basicAResults.reduce((sum, r, i) => {
      const b = basicBResults[i];
      return sum + (r.averageTime / (b?.averageTime || 1));
    }, 0) / basicAResults.length;

    if (avgSpeedup > 1.2) {
      console.log('  ✅ 推荐使用 EngineB (ECS架构)');
      console.log('    - 适合大量相同类型对象的场景');
      console.log('    - 更好的缓存局部性和并行处理潜力');
      console.log('    - 适合高性能要求的游戏');
    } else if (avgSpeedup < 0.8) {
      console.log('  ✅ 推荐使用 EngineA (传统OOP架构)');
      console.log('    - 适合复杂逻辑和对象交互的场景');
      console.log('    - 更灵活的消息系统');
      console.log('    - 适合小到中等规模的项目');
    } else {
      console.log('  ⚖️ 两种架构性能相近');
      console.log('    - 根据项目需求和团队熟悉度选择');
      console.log('    - EngineA 更易理解，EngineB 更具扩展性');
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0; // 如果浏览器不支持memory API
  }

  getResults(): TestResult[] {
    return [...this.results];
  }

  clearResults(): void {
    this.results = [];
    this.messageCount = 0;
  }
}

// -------------------------------------
// 主测试函数 - 增强版
// -------------------------------------
export async function runPerformanceTest(): Promise<void> {
  const tester = new PerformanceTester();
  
  // 测试不同规模的对象数量
  const objectCounts = [100, 500, 1000, 2000, 5000];
  const iterations = 1000;
  
  console.log('🎮 TypeScript 游戏引擎架构增强版性能测试');
  console.log(`📋 测试参数: 迭代次数=${iterations}, 对象数量=${objectCounts.join(', ')}`);
  console.log('📊 新增功能: 复杂AI行为, 消息系统, 物理模拟, 内存分析');
  
  await tester.runComparison(objectCounts, iterations);
}

// 专门的基准测试函数
export async function runBenchmarkSuite(): Promise<void> {
  const tester = new PerformanceTester();
  
  console.log('🏆 游戏引擎基准测试套件');
  console.log('='.repeat(50));
  
  // 小规模快速测试
  console.log('\n🔥 小规模快速测试 (100对象, 500迭代)');
  await tester.runComparison([100], 500);
  
  // 中等规模测试
  console.log('\n⚡ 中等规模测试 (1000对象, 1000迭代)');
  await tester.runComparison([1000], 1000);
  
  // 大规模压力测试
  console.log('\n💪 大规模压力测试 (5000对象, 500迭代)');
  await tester.runComparison([5000], 500);
}

// 兼容不同环境的运行检测
const isBrowser = typeof window !== 'undefined';

// 浏览器环境导出
if (isBrowser) {
  (window as any).runPerformanceTest = runPerformanceTest;
  (window as any).runBenchmarkSuite = runBenchmarkSuite;
  (window as any).PerformanceTester = PerformanceTester;
  (window as any).MathUtils = MathUtils;
  (window as any).AIState = AIState;
  
  console.log('🚀 增强版性能测试模块已加载');
  console.log('📝 可用命令:');
  console.log('  - window.runPerformanceTest() // 完整测试');
  console.log('  - window.runBenchmarkSuite() // 基准测试套件');
  console.log('  - new window.PerformanceTester() // 自定义测试');
}