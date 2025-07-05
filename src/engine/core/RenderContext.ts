// engine/core/RenderContext.ts
export abstract class RenderContext {
    abstract get width(): number;
    abstract get height(): number;
    
    abstract clear(): void;
    abstract save(): void;
    abstract restore(): void;
    
    abstract translate(x: number, y: number): void;
    abstract rotate(angle: number): void;
    abstract scale(x: number, y: number): void;
    
    abstract set fillStyle(style: string | CanvasGradient | CanvasPattern);
    abstract set strokeStyle(style: string | CanvasGradient | CanvasPattern);
    abstract set lineWidth(width: number);
    abstract set globalAlpha(alpha: number);
    
    abstract fillRect(x: number, y: number, width: number, height: number): void;
    abstract strokeRect(x: number, y: number, width: number, height: number): void;
    
    abstract beginPath(): void;
    abstract closePath(): void;
    abstract moveTo(x: number, y: number): void;
    abstract lineTo(x: number, y: number): void;
    abstract arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
    abstract fill(): void;
    abstract stroke(): void;
    
    abstract drawImage(
      image: CanvasImageSource,
      dx: number,
      dy: number,
      dw?: number,
      dh?: number
    ): void;
  }
  
  // Canvas2D实现
  export class Canvas2DRenderContext extends RenderContext {
    constructor(private context: CanvasRenderingContext2D) {
      super();
    }
    
    get width(): number {
      return this.context.canvas.width;
    }
    
    get height(): number {
      return this.context.canvas.height;
    }
    
    clear(): void {
      this.context.clearRect(0, 0, this.width, this.height);
    }
    
    save(): void {
      this.context.save();
    }
    
    restore(): void {
      this.context.restore();
    }
    
    translate(x: number, y: number): void {
      this.context.translate(x, y);
    }
    
    rotate(angle: number): void {
      this.context.rotate(angle);
    }
    
    scale(x: number, y: number): void {
      this.context.scale(x, y);
    }
    
    set fillStyle(style: string | CanvasGradient | CanvasPattern) {
      this.context.fillStyle = style;
    }
    
    set strokeStyle(style: string | CanvasGradient | CanvasPattern) {
      this.context.strokeStyle = style;
    }
    
    set lineWidth(width: number) {
      this.context.lineWidth = width;
    }
    
    set globalAlpha(alpha: number) {
      this.context.globalAlpha = alpha;
    }
    
    fillRect(x: number, y: number, width: number, height: number): void {
      this.context.fillRect(x, y, width, height);
    }
    
    strokeRect(x: number, y: number, width: number, height: number): void {
      this.context.strokeRect(x, y, width, height);
    }
    
    beginPath(): void {
      this.context.beginPath();
    }
    
    closePath(): void {
      this.context.closePath();
    }
    
    moveTo(x: number, y: number): void {
      this.context.moveTo(x, y);
    }
    
    lineTo(x: number, y: number): void {
      this.context.lineTo(x, y);
    }
    
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {
      this.context.arc(x, y, radius, startAngle, endAngle);
    }
    
    fill(): void {
      this.context.fill();
    }
    
    stroke(): void {
      this.context.stroke();
    }
    
    drawImage(
      image: CanvasImageSource,
      dx: number,
      dy: number,
      dw?: number,
      dh?: number
    ): void {
      if (dw !== undefined && dh !== undefined) {
        this.context.drawImage(image, dx, dy, dw, dh);
      } else {
        this.context.drawImage(image, dx, dy);
      }
    }
  }