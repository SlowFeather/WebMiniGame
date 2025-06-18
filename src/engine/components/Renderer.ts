import { Component } from '../core/Component';

export abstract class Renderer extends Component {
  public visible: boolean = true;
  public layer: number = 0;
  public sortingOrder: number = 0;
  
  abstract render(context: CanvasRenderingContext2D): void;
}