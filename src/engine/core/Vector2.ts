export class Vector2 {
    constructor(public x: number = 0, public y: number = 0) {}

    set(x: number, y: number): this {
      this.x = x;
      this.y = y;
      return this;
    }
    
    // 可选：也可以添加从另一个 Vector2 设置值的重载
    setFrom(other: Vector2): this {
      this.x = other.x;
      this.y = other.y;
      return this;
    }
  
    static get zero(): Vector2 {
      return new Vector2(0, 0);
    }
  
    static get one(): Vector2 {
      return new Vector2(1, 1);
    }
  
    static get up(): Vector2 {
      return new Vector2(0, -1);
    }
  
    static get down(): Vector2 {
      return new Vector2(0, 1);
    }
  
    static get left(): Vector2 {
      return new Vector2(-1, 0);
    }
  
    static get right(): Vector2 {
      return new Vector2(1, 0);
    }
  
    // 向量运算
    add(v: Vector2): Vector2 {
      return new Vector2(this.x + v.x, this.y + v.y);
    }
  
    subtract(v: Vector2): Vector2 {
      return new Vector2(this.x - v.x, this.y - v.y);
    }
  
    multiply(scalar: number): Vector2 {
      return new Vector2(this.x * scalar, this.y * scalar);
    }
  
    divide(scalar: number): Vector2 {
      return new Vector2(this.x / scalar, this.y / scalar);
    }
  
    // 向量属性
    get magnitude(): number {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
  
    get sqrMagnitude(): number {
      return this.x * this.x + this.y * this.y;
    }
  
    get normalized(): Vector2 {
      const mag = this.magnitude;
      return mag > 0 ? this.divide(mag) : Vector2.zero;
    }
  
    // 静态方法
    static distance(a: Vector2, b: Vector2): number {
      return a.subtract(b).magnitude;
    }
  
    static dot(a: Vector2, b: Vector2): number {
      return a.x * b.x + a.y * b.y;
    }
  
    static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
      t = Math.max(0, Math.min(1, t));
      return new Vector2(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t
      );
    }
  
    // 克隆
    clone(): Vector2 {
      return new Vector2(this.x, this.y);
    }
  
    // 相等比较
    equals(v: Vector2): boolean {
      return this.x === v.x && this.y === v.y;
    }
  }