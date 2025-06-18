import { Component } from '../core/Component';
import { Vector2 } from '../core/Vector2';

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export class ParticleSystem extends Component {
  public maxParticles: number = 100;
  public emissionRate: number = 10; // 每秒发射粒子数
  public particleLifetime: number = 2; // 秒
  public startSpeed: number = 50;
  public startSize: number = 5;
  public startColor: string = '#ffffff';
  public endColor: string = '#000000';
  public gravity: Vector2 = new Vector2(0, 100);
  public emissionShape: 'point' | 'circle' | 'rectangle' = 'point';
  public emissionRadius: number = 10;
  public emissionWidth: number = 50;
  public emissionHeight: number = 50;
  
  private particles: Particle[] = [];
  private emissionTimer: number = 0;

  getTypeName(): string {
    return 'ParticleSystem';
  }

  update(deltaTime: number): void {
    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // 更新位置
      particle.velocity = particle.velocity.add(this.gravity.multiply(deltaTime));
      particle.position = particle.position.add(particle.velocity.multiply(deltaTime));
      
      // 更新生命周期
      particle.life -= deltaTime;
      
      // 更新透明度
      particle.alpha = particle.life / particle.maxLife;
      
      // 移除死亡粒子
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // 发射新粒子
    this.emissionTimer += deltaTime;
    const particlesToEmit = Math.floor(this.emissionTimer * this.emissionRate);
    if (particlesToEmit > 0) {
      this.emissionTimer -= particlesToEmit / this.emissionRate;
      
      for (let i = 0; i < particlesToEmit && this.particles.length < this.maxParticles; i++) {
        this.emitParticle();
      }
    }
  }

  private emitParticle(): void {
    const transform = this.gameObject.transform;
    let localPosition = Vector2.zero;
    
    // 根据发射形状生成位置
    switch (this.emissionShape) {
      case 'circle':
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.emissionRadius;
        localPosition = new Vector2(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        );
        break;
        
      case 'rectangle':
        localPosition = new Vector2(
          (Math.random() - 0.5) * this.emissionWidth,
          (Math.random() - 0.5) * this.emissionHeight
        );
        break;
    }
    
    // 生成速度
    const speed = this.startSpeed * (0.5 + Math.random() * 0.5);
    const direction = Math.random() * Math.PI * 2;
    const velocity = new Vector2(
      Math.cos(direction) * speed,
      Math.sin(direction) * speed
    );
    
    // 创建粒子
    const particle: Particle = {
      position: transform.worldPosition.add(localPosition),
      velocity: velocity,
      life: this.particleLifetime,
      maxLife: this.particleLifetime,
      size: this.startSize,
      color: this.startColor,
      alpha: 1
    };
    
    this.particles.push(particle);
  }

  getParticles(): readonly Particle[] {
    return this.particles;
  }

  clear(): void {
    this.particles = [];
  }
}