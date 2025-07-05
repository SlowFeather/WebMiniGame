import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';
import { UIElement } from '../components/UIElement';

export class UISystem extends ComponentSystem {

  getComponentTypes(): string[] {
    return ['UISystem'];
  }

  private uiContainer: HTMLDivElement;

  constructor() {
    super();
    
    // 创建UI容器
    this.uiContainer = document.createElement('div');
    this.uiContainer.id = 'game-ui-container';
    this.uiContainer.style.position = 'absolute';
    this.uiContainer.style.top = '0';
    this.uiContainer.style.left = '0';
    this.uiContainer.style.width = '100%';
    this.uiContainer.style.height = '100%';
    this.uiContainer.style.pointerEvents = 'none';
    this.uiContainer.style.zIndex = '1000';
    
    document.body.appendChild(this.uiContainer);
  }

  onDestroy(): void {
    if (this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }

  update(deltaTime: number, components: Component[]): void {
    const uiElements = components.filter(c => c.enabled) as UIElement[];
    
    for (const element of uiElements) {
      // 更新DOM变换
      element['updateDOMTransform']();
    }
  }

  getContainer(): HTMLDivElement {
    return this.uiContainer;
  }
}