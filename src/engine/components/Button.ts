import { UIElement } from './UIElement';
import { EventSystem } from '../core/EventSystem';

export class Button extends UIElement {
  public text: string = 'Button';
  public onClick: (() => void) | null = null;
  
  private button!: HTMLButtonElement;

  getTypeName(): string {
    return 'Button';
  }

  protected createDOMElement(): void {
    this.button = document.createElement('button');
    this.button.textContent = this.text;
    this.button.style.position = 'absolute';
    this.button.style.width = `${this.width}px`;
    this.button.style.height = `${this.height}px`;
    
    this.button.addEventListener('click', this.handleClick);
    
    this.domElement = this.button;
    document.body.appendChild(this.button);
    
    this.updateDOMTransform();
  }

  private handleClick = (): void => {
    if (this.onClick) {
      this.onClick();
    }
    EventSystem.instance.emit('button:click', { button: this });
  };

  setText(text: string): void {
    this.text = text;
    if (this.button) {
      this.button.textContent = text;
    }
  }
}