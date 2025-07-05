import { GameObject } from './GameObject';

export abstract class Component {
  public gameObject!: GameObject;
  public enabled: boolean = true;
  
  // 组件是否已经初始化
  private _initialized: boolean = false;
  
  // 组件的唯一ID（用于快速查找）
  private static _nextComponentId = 0;
  public readonly componentId: number = Component._nextComponentId++;

  abstract getTypeName(): string;
  
  // 声明依赖的组件类型
  static dependencies?: Array<new () => Component>;
  
  // 生命周期方法
  onInit(): void {
    this._initialized = true;
  }
  
  onDestroy(): void {
    this._initialized = false;
  }
  
  // 激活状态变化时的回调
  onEnable(): void {}
  onDisable(): void {}
  
  // 设置enabled属性时触发回调
  setEnabled(value: boolean): void {
    if (this.enabled === value) return;
    
    this.enabled = value;
    if (value) {
      this.onEnable();
    } else {
      this.onDisable();
    }
  }
  
  // 验证依赖
  validateDependencies(): boolean {
    const deps = (this.constructor as any).dependencies;
    if (!deps) return true;
    
    for (const dep of deps) {
      if (!this.gameObject.hasComponent(dep)) {
        console.warn(`Component ${this.getTypeName()} requires ${dep.name}`);
        return false;
      }
    }
    return true;
  }
  
  // 获取依赖的组件
  protected getDependency<T extends Component>(ComponentClass: new () => T): T {
    const component = this.gameObject.getComponent(ComponentClass);
    if (!component) {
      throw new Error(`${this.getTypeName()} requires ${ComponentClass.name} component`);
    }
    return component;
  }
  
  // 检查组件是否已初始化
  get initialized(): boolean {
    return this._initialized;
  }
  
  // 可选的序列化方法
  serialize?(): any;
  deserialize?(data: any): void;
  
  // 可选的克隆方法
  clone?(): Component;
}