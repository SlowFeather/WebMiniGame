import { Component } from '../core/Component';
import { ResourceManager } from '../core/ResourceManager';

export class AudioSource extends Component {
  public audioId: string | null = null;
  public volume: number = 1.0;
  public pitch: number = 1.0;
  public loop: boolean = false;
  public playOnStart: boolean = false;
  public spatial: boolean = false; // 3D音频
  public minDistance: number = 1;
  public maxDistance: number = 100;
  
  private audio: HTMLAudioElement | null = null;

  getTypeName(): string {
    return 'AudioSource';
  }

  onInit(): void {
    if (this.playOnStart && this.audioId) {
      this.play();
    }
  }

  play(): void {
    if (!this.audioId) return;
    
    this.audio = ResourceManager.instance.get<HTMLAudioElement>(this.audioId);
    if (!this.audio) return;
    
    this.audio.volume = this.volume;
    this.audio.loop = this.loop;
    this.audio.playbackRate = this.pitch;
    
    this.audio.play().catch(error => {
      console.error('Failed to play audio:', error);
    });
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  onDestroy(): void {
    this.stop();
  }
}