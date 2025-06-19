import { Component } from './Component';
import { Transform } from '../components/Transform';
import { Engine } from './Engine';

export class GameObject {
  private static nextId = 0;
  public readonly id: number;
  public name: string;
  public tag: string = '';
  public isActive: boolean = true;
  private components: Component[] = [];
  private _transform: Transform;
  
  // 父子关系
  private _parent: GameObject | null = null;
  private _children: GameObject[] = [];

  constructor(name: string = 'GameObject') {
    this.id = GameObject.nextId++;
    this.name = name;
    
    // 每个GameObject都有Transform组件
    this._transform = this.addComponent(Transform);
    
    // 注册到引擎
    Engine.instance.registerGameObject(this);
  }

  get transform(): Transform {
    return this._transform;
  }

  get parent(): GameObject | null {
    return this._parent;
  }

  set parent(value: GameObject | null) {
    if (this._parent === value) return;
    
    // 从旧父对象移除
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index > -1) {
        this._parent._children.splice(index, 1);
      }
    }
    
    this._parent = value;
    
    // 添加到新父对象
    if (value) {
      value._children.push(this);
    }
  }

  get children(): readonly GameObject[] {
    return this._children;
  }

  // 添加组件
  addComponent<T extends Component>(ComponentClass: new () => T): T {
    const component = new ComponentClass();
    component.gameObject = this;
    this.components.push(component);
    
    // 注册到引擎
    Engine.instance.registerComponent(component);
    
    // 初始化组件
    component.onInit();
    
    return component;
  }

  // 获取组件
  getComponent<T extends Component>(ComponentClass: new () => T): T | null {
    return this.components.find(c => c instanceof ComponentClass) as T || null;
  }

  // 获取所有指定类型的组件
  getComponents<T extends Component>(ComponentClass: new () => T): T[] {
    return this.components.filter(c => c instanceof ComponentClass) as T[];
  }

  // 获取所有组件 - 新增方法
  getAllComponents(): Component[] {
    return [...this.components]; // 返回组件数组的副本，避免外部修改
  }

  // 检查是否拥有指定类型的组件
  hasComponent<T extends Component>(ComponentClass: new () => T): boolean {
    return this.components.some(c => c instanceof ComponentClass);
  }

  // 获取组件数量
  getComponentCount(): number {
    return this.components.length;
  }

  // 通过类型名获取组件（用于序列化/反序列化）
  getComponentByTypeName(typeName: string): Component | null {
    return this.components.find(c => c.getTypeName() === typeName) || null;
  }

  // 获取所有指定类型名的组件
  getComponentsByTypeName(typeName: string): Component[] {
    return this.components.filter(c => c.getTypeName() === typeName);
  }

  // 移除组件
  removeComponent<T extends Component>(ComponentClass: new () => T): boolean {
    const index = this.components.findIndex(c => c instanceof ComponentClass);
    if (index > -1) {
      const component = this.components[index];
      
      // 从引擎注销
      Engine.instance.unregisterComponent(component);
      
      // 销毁组件
      component.onDestroy();
      
      this.components.splice(index, 1);
      return true;
    }
    return false;
  }

  // 移除指定的组件实例
  removeComponentInstance(component: Component): boolean {
    const index = this.components.indexOf(component);
    if (index > -1) {
      // 从引擎注销
      Engine.instance.unregisterComponent(component);
      
      // 销毁组件
      component.onDestroy();
      
      this.components.splice(index, 1);
      return true;
    }
    return false;
  }

  // 移除所有指定类型的组件
  removeAllComponents<T extends Component>(ComponentClass: new () => T): number {
    const componentsToRemove = this.components.filter(c => c instanceof ComponentClass);
    let removedCount = 0;
    
    for (const component of componentsToRemove) {
      if (this.removeComponentInstance(component)) {
        removedCount++;
      }
    }
    
    return removedCount;
  }

  // 查找子对象（按名称）
  findChild(name: string): GameObject | null {
    return this._children.find(child => child.name === name) || null;
  }

  // 查找子对象（按标签）
  findChildByTag(tag: string): GameObject | null {
    return this._children.find(child => child.tag === tag) || null;
  }

  // 递归查找子对象（按名称）
  findChildRecursive(name: string): GameObject | null {
    // 先在直接子对象中查找
    const directChild = this.findChild(name);
    if (directChild) return directChild;
    
    // 递归在子对象的子对象中查找
    for (const child of this._children) {
      const found = child.findChildRecursive(name);
      if (found) return found;
    }
    
    return null;
  }

  // 获取所有子对象（递归）
  getAllChildren(): GameObject[] {
    const allChildren: GameObject[] = [];
    
    for (const child of this._children) {
      allChildren.push(child);
      allChildren.push(...child.getAllChildren());
    }
    
    return allChildren;
  }

  // 设置激活状态
  setActive(active: boolean): void {
    if (this.isActive === active) return;
    
    this.isActive = active;
    
    // 通知所有组件状态变化
    for (const component of this.components) {
      if (active && component.onEnable) {
        component.onEnable();
      } else if (!active && component.onDisable) {
        component.onDisable();
      }
    }
    
    // 递归设置子对象状态（可选，根据需求决定）
    // for (const child of this._children) {
    //   child.setActive(active);
    // }
  }

  // 检查是否在层级中激活（考虑父对象状态）
  isActiveInHierarchy(): boolean {
    if (!this.isActive) return false;
    if (!this._parent) return true;
    return this._parent.isActiveInHierarchy();
  }

  // 销毁游戏对象
  destroy(): void {
    // 销毁所有子对象
    for (const child of [...this._children]) {
      child.destroy();
    }
    
    // 从父对象移除
    this.parent = null;
    
    // 销毁所有组件
    for (const component of this.components) {
      Engine.instance.unregisterComponent(component);
      component.onDestroy();
    }
    this.components = [];
    
    // 从引擎注销
    Engine.instance.unregisterGameObject(this);
  }

  // 克隆游戏对象
  clone(newName?: string): GameObject {
    const cloned = new GameObject(newName || `${this.name} (Clone)`);
    cloned.tag = this.tag;
    cloned.isActive = this.isActive;
    
    // 复制Transform
    cloned.transform.position = this.transform.position.clone();
    cloned.transform.rotation = this.transform.rotation;
    cloned.transform.scale = this.transform.scale.clone();
    
    // 复制其他组件（跳过Transform因为已经存在）
    for (const component of this.components) {
      if (component !== this._transform && component.clone) {
        const clonedComponent = component.clone();
        clonedComponent.gameObject = cloned;
        cloned.components.push(clonedComponent);
        Engine.instance.registerComponent(clonedComponent);
        clonedComponent.onInit();
      }
    }
    
    // 递归克隆子对象
    for (const child of this._children) {
      const clonedChild = child.clone();
      clonedChild.parent = cloned;
    }
    
    return cloned;
  }

  // 序列化
  serialize(): any {
    return {
      id: this.id,
      name: this.name,
      tag: this.tag,
      isActive: this.isActive,
      transform: {
        position: { x: this.transform.position.x, y: this.transform.position.y },
        rotation: this.transform.rotation,
        scale: { x: this.transform.scale.x, y: this.transform.scale.y }
      },
      components: this.components
        .filter(c => c !== this._transform) // Transform单独处理
        .map(c => ({
          type: c.getTypeName(),
          data: c.serialize ? c.serialize() : {}
        })),
      children: this._children.map(child => child.serialize())
    };
  }

  // 反序列化（静态方法）
  static deserialize(data: any): GameObject {
    const gameObject = new GameObject(data.name);
    gameObject.tag = data.tag || '';
    gameObject.isActive = data.isActive ?? true;
    
    // 设置Transform
    if (data.transform) {
      gameObject.transform.position.set(
        data.transform.position.x || 0,
        data.transform.position.y || 0
      );
      gameObject.transform.rotation = data.transform.rotation || 0;
      gameObject.transform.scale.set(
        data.transform.scale.x || 1,
        data.transform.scale.y || 1
      );
    }
    
    // 反序列化组件（需要组件注册表支持）
    if (data.components) {
      for (const componentData of data.components) {
        // 这里需要根据实际的组件注册系统来创建组件
        // const ComponentClass = Engine.instance.getComponentClass(componentData.type);
        // if (ComponentClass) {
        //   const component = gameObject.addComponent(ComponentClass);
        //   if (component.deserialize) {
        //     component.deserialize(componentData.data);
        //   }
        // }
      }
    }
    
    // 反序列化子对象
    if (data.children) {
      for (const childData of data.children) {
        const child = GameObject.deserialize(childData);
        child.parent = gameObject;
      }
    }
    
    return gameObject;
  }

  // 调试信息
  getDebugInfo(): string {
    const info = [
      `GameObject: ${this.name} (ID: ${this.id})`,
      `Tag: ${this.tag}`,
      `Active: ${this.isActive}`,
      `Components: ${this.components.length}`,
      `Children: ${this._children.length}`,
      `Parent: ${this._parent ? this._parent.name : 'None'}`,
      `Position: (${this.transform.position.x.toFixed(2)}, ${this.transform.position.y.toFixed(2)})`,
      `Rotation: ${this.transform.rotation.toFixed(2)}°`,
      `Scale: (${this.transform.scale.x.toFixed(2)}, ${this.transform.scale.y.toFixed(2)})`
    ];
    
    return info.join('\n');
  }
}