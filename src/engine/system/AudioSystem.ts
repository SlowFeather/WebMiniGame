import { ComponentSystem } from '../core/ComponentSystem';
import { Component } from '../core/Component';
import { AudioSource } from '../components/AudioSource';
import { Engine } from '../core/Engine';
import { Vector2 } from '../core/Vector2';

export class AudioSystem extends ComponentSystem {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 1.0;
  private listenerPosition: Vector2 = Vector2.zero;

  onInit(): void {
    // 创建音频上下文
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
    }
    
    // 监听音量事件
    Engine.instance.eventSystem.on('audio:setMasterVolume', (volume: number) => {
      this.masterVolume = volume;
    });
    
    Engine.instance.eventSystem.on('audio:setListenerPosition', (position: Vector2) => {
      this.listenerPosition = position;
    });
  }

  update(deltaTime: number, components: Component[]): void {
    const audioSources = components.filter(c => c.enabled) as AudioSource[];
    
    for (const source of audioSources) {
      // 3D音频处理
      if (source.spatial && this.audioContext) {
        const transform = source.gameObject.transform;
        const distance = Vector2.distance(transform.position, this.listenerPosition);
        
        // 简单的距离衰减
        const attenuation = 1 - Math.min(1, Math.max(0, 
          (distance - source.minDistance) / (source.maxDistance - source.minDistance)
        ));
        
        // 应用音量
        const audio = source['audio'];
        if (audio) {
          audio.volume = source.volume * attenuation * this.masterVolume;
        }
      }
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Engine.instance.eventSystem.emit('audio:masterVolumeChanged', this.masterVolume);
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }
}