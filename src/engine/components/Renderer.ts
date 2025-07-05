import { Component } from '../core/Component';
import { Transform } from './Transform';
import { RenderContext } from '../core/RenderContext';

export abstract class Renderer extends Component {
  public visible: boolean = true;
  public layer: number = 0;
  public sortingOrder: number = 0;
  
  // 声明依赖Transform组件
  static dependencies = [Transform];
  
  abstract render(context: RenderContext): void;
  
  // 获取Transform的便捷方法
  protected get transform(): Transform {
    return this.getDependency(Transform);
  }
}