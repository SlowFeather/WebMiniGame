import { Component } from '../core/Component';

export interface AnimationClip {
  name: string;
  duration: number;
  loop: boolean;
  frames: AnimationFrame[];
}

export interface AnimationFrame {
  time: number;
  properties: { [key: string]: any };
}

export class Animator extends Component {
  public clips: Map<string, AnimationClip> = new Map();
  public currentClip: string | null = null;
  public speed: number = 1.0;
  public playing: boolean = false;
  
  private currentTime: number = 0;
  private lastFrameIndex: number = 0;

  getTypeName(): string {
    return 'Animator';
  }

  addClip(clip: AnimationClip): void {
    this.clips.set(clip.name, clip);
  }

  play(clipName: string, restart: boolean = false): void {
    const clip = this.clips.get(clipName);
    if (!clip) {
      console.warn(`Animation clip '${clipName}' not found`);
      return;
    }
    
    if (this.currentClip !== clipName || restart) {
      this.currentClip = clipName;
      this.currentTime = 0;
      this.lastFrameIndex = 0;
      this.playing = true;
    }
  }

  stop(): void {
    this.playing = false;
    this.currentTime = 0;
    this.lastFrameIndex = 0;
  }

  pause(): void {
    this.playing = false;
  }

  resume(): void {
    this.playing = true;
  }

  update(deltaTime: number): void {
    if (!this.playing || !this.currentClip) return;
    
    const clip = this.clips.get(this.currentClip);
    if (!clip) return;
    
    // 更新时间
    this.currentTime += deltaTime * this.speed;
    
    // 循环处理
    if (this.currentTime >= clip.duration) {
      if (clip.loop) {
        this.currentTime %= clip.duration;
        this.lastFrameIndex = 0;
      } else {
        this.currentTime = clip.duration;
        this.playing = false;
      }
    }
    
    // 应用动画帧
    this.applyFrame(clip);
  }

  private applyFrame(clip: AnimationClip): void {
    // 找到当前时间对应的帧
    let frameIndex = this.lastFrameIndex;
    while (frameIndex < clip.frames.length && clip.frames[frameIndex].time <= this.currentTime) {
      frameIndex++;
    }
    
    if (frameIndex > 0) {
      frameIndex--;
    }
    
    this.lastFrameIndex = frameIndex;
    
    // 应用帧属性
    const frame = clip.frames[frameIndex];
    if (frame) {
      // 这里可以根据具体需求应用动画属性
      // 例如：修改transform、renderer等组件的属性
      for (const [key, value] of Object.entries(frame.properties)) {
        // 简化示例：直接应用到transform
        if (key === 'position' && this.gameObject.transform) {
          this.gameObject.transform.position.x = value.x;
          this.gameObject.transform.position.y = value.y;
        } else if (key === 'rotation' && this.gameObject.transform) {
          this.gameObject.transform.rotation = value;
        } else if (key === 'scale' && this.gameObject.transform) {
          this.gameObject.transform.scale.x = value.x;
          this.gameObject.transform.scale.y = value.y;
        }
      }
    }
  }
}