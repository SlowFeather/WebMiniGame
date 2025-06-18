import { Component } from '../core/Component';
import { Vector2 } from '../core/Vector2';

export abstract class Collider extends Component {
  public isTrigger: boolean = false;
  public offset: Vector2 = new Vector2(0, 0);
  
  abstract checkCollision(other: Collider): boolean;
  abstract getWorldBounds(): { min: Vector2, max: Vector2 };
}