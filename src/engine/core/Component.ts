import { GameObject } from './GameObject';

export abstract class Component {
  public gameObject!: GameObject;
  public enabled: boolean = true;

  abstract getTypeName(): string;
  
  // 生命周期方法
  onInit(): void {}
  onDestroy(): void {}
  
  // 激活状态变化时的回调
  onEnable(): void {}
  onDisable(): void {}
  
  // 可选的序列化方法
  serialize?(): any;
  deserialize?(data: any): void;
  
  // 可选的克隆方法
  clone?(): Component;
}