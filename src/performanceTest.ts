// performanceTest.ts
import { performance } from 'perf_hooks';

// -------------------------------------
// 公共基类：Component
// -------------------------------------
export abstract class Component {
  public gameObject!: { id: number; addComponent(c: Component): any };
  public enabled: boolean = true;
  public isDestroyed: boolean = false;
  abstract getTypeName(): string;
  onInit(): void {}
  update(dt: number): void {}
  destroy(): void {
    this.isDestroyed = true;
  }
}

// -------------------------------------
// 第一种：EngineA 驱动 GameObjectA
// -------------------------------------
export class TransformA extends Component {
  public x = 0;
  public y = 0;
  getTypeName() { return 'TransformA'; }
}

export class GameObjectA {
  public id: number;
  private static _count = 0;
  private components: Component[] = [];
  public children: GameObjectA[] = [];
  public parent: GameObjectA | null = null;
  public isActive = true;

  constructor(public name: string) {
    this.id = GameObjectA._count++;
    // 默认添加 Transform
    this.addComponent(new TransformA());
  }

  addComponent<T extends Component>(comp: T): T {
    comp.gameObject = this as any;
    this.components.push(comp);
    comp.onInit();
    return comp;
  }

  update(dt: number) {
    if (!this.isActive) return;
    for (const c of this.components) {
      if (c.enabled && !c.isDestroyed) c.update(dt);
    }
    for (const ch of this.children) {
      ch.update(dt);
    }
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

  // 单步更新公开
  public step() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    for (const go of this.gameObjects) {
      go.update(dt);
    }
  }

  // 初始化计时
  public initTimer() {
    this.lastTime = performance.now();
  }
}

// -------------------------------------
// 第二种：EngineB 批量驱动 Component
// -------------------------------------
export interface ComponentSystem {
  update(dt: number, comps: Component[]): void;
}

export class TransformB extends Component {
  public x = 0;
  public y = 0;
  getTypeName() { return 'TransformB'; }
}

export class TransformSystem implements ComponentSystem {
  update(dt: number, comps: Component[]) {
    // 简单遍历，模拟层级计算（此处仅做空循环）
    for (const c of comps as TransformB[]) {
      const _ = c.x + c.y + dt;
    }
  }
}

export class EngineB {
  private static _inst: EngineB;
  private systems = new Map<string, ComponentSystem>();
  private compMap = new Map<string, Component[]>();
  private lastTime = 0;

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
    const arr = this.compMap.get(name)!;
    arr.push(c);
  }

  step() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    for (const [typeName, sys] of this.systems) {
      const comps = this.compMap.get(typeName)!;
      sys.update(dt, comps);
    }
  }

  initTimer() {
    this.lastTime = performance.now();
    
  }
}

