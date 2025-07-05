import { UIElement } from './UIElement';

export class Text extends UIElement {
  public fontSize: number = 16;
  public fontFamily: string = 'Arial';
  public color: string = '#000000';
  public align: 'left' | 'center' | 'right' = 'left';
  
  private textElement!: HTMLDivElement;

  getTypeName(): string {
    return 'Text';
  }

  protected createDOMElement(): void {
    this.textElement = document.createElement('div');
    this.textElement.textContent = this._content;
    this.textElement.style.position = 'absolute';
    this.textElement.style.width = `${this.width}px`;
    this.textElement.style.height = `${this.height}px`;
    this.textElement.style.fontSize = `${this.fontSize}px`;
    this.textElement.style.fontFamily = this.fontFamily;
    this.textElement.style.color = this.color;
    this.textElement.style.textAlign = this.align;
    this.textElement.style.pointerEvents = 'none';
    this.textElement.style.whiteSpace = 'pre-line'; // Allow line breaks
    this.textElement.style.overflow = 'visible';
    this.textElement.style.lineHeight = '1.4'; // Add proper line spacing
    
    this.domElement = this.textElement;
    
    // Try to add to UI container, fallback to body
    const uiContainer = document.getElementById('game-ui-container');
    if (uiContainer) {
      uiContainer.appendChild(this.textElement);
    } else {
      document.body.appendChild(this.textElement);
    }
    
    this.updateDOMTransform();
  }

  setContent(content: string): void {
    this.content = content;
    if (this.textElement) {
      this.textElement.textContent = content;
    }
  }

  // Override content setter to update DOM
  set content(value: string) {
    this._content = value;
    if (this.textElement) {
      this.textElement.textContent = value;
    }
  }

  get content(): string {
    return this._content;
  }

  private _content: string = 'Text';

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