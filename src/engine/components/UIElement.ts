import { Component } from '../core/Component';

export abstract class UIElement extends Component {
  public width: number = 100;
  public height: number = 50;
  public anchor: { x: number, y: number } = { x: 0.5, y: 0.5 };
  public pivot: { x: number, y: number } = { x: 0.5, y: 0.5 };
  public interactive: boolean = true;
  
  protected domElement: HTMLElement | null = null;

  onInit(): void {
    this.createDOMElement();
  }

  onDestroy(): void {
    if (this.domElement && this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }
  }

  protected abstract createDOMElement(): void;
  
  protected updateDOMTransform(): void {
    if (!this.domElement) return;
    
    const transform = this.gameObject.transform;
    
    // Convert from canvas coordinates (center origin) to screen coordinates (top-left origin)
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    
    const screenX = transform.position.x + screenCenterX - this.width * this.pivot.x;
    const screenY = transform.position.y + screenCenterY - this.height * this.pivot.y;
    
    this.domElement.style.left = `${screenX}px`;
    this.domElement.style.top = `${screenY}px`;
    this.domElement.style.transform = `rotate(${transform.rotation}deg) scale(${transform.scale.x}, ${transform.scale.y})`;
  }
}