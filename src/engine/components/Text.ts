import { UIElement } from './UIElement';

export class Text extends UIElement {
  public content: string = 'Text';
  public fontSize: number = 16;
  public fontFamily: string = 'Arial';
  public color: string = '#000000';
  public align: 'left' | 'center' | 'right' = 'center';
  
  private textElement!: HTMLDivElement;

  getTypeName(): string {
    return 'Text';
  }

  protected createDOMElement(): void {
    this.textElement = document.createElement('div');
    this.textElement.textContent = this.content;
    this.textElement.style.position = 'absolute';
    this.textElement.style.width = `${this.width}px`;
    this.textElement.style.height = `${this.height}px`;
    this.textElement.style.fontSize = `${this.fontSize}px`;
    this.textElement.style.fontFamily = this.fontFamily;
    this.textElement.style.color = this.color;
    this.textElement.style.textAlign = this.align;
    this.textElement.style.pointerEvents = 'none';
    
    this.domElement = this.textElement;
    document.body.appendChild(this.textElement);
    
    this.updateDOMTransform();
  }

  setContent(content: string): void {
    this.content = content;
    if (this.textElement) {
      this.textElement.textContent = content;
    }
  }

  setStyle(style: Partial<{
    fontSize: number;
    fontFamily: string;
    color: string;
    align: 'left' | 'center' | 'right';
  }>): void {
    Object.assign(this, style);
    
    if (this.textElement) {
      if (style.fontSize !== undefined) this.textElement.style.fontSize = `${style.fontSize}px`;
      if (style.fontFamily !== undefined) this.textElement.style.fontFamily = style.fontFamily;
      if (style.color !== undefined) this.textElement.style.color = style.color;
      if (style.align !== undefined) this.textElement.style.textAlign = style.align;
    }
  }
}