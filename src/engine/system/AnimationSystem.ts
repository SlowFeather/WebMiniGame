import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';
import { Animator } from '../components/Animator';

export class AnimationSystem extends ComponentSystem {
  update(deltaTime: number, components: Component[]): void {
    const animators = components.filter(c => c.enabled) as Animator[];
    
    for (const animator of animators) {
      animator.update(deltaTime);
    }
  }
}