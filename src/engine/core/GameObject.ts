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
      components: this.components.map(c => ({
        type: c.getTypeName(),
        data: c.serialize ? c.serialize() : {}
      }))
    };
  }
}
