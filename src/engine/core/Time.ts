/**
 * 时间管理类 - 单例模式
 * 用于管理游戏或应用程序的时间系统，包括帧间隔时间、总运行时间等
 */
export class Time {
  /**
   * 单例实例
   */
  private static _instance: Time;
  
  /**
   * 开始时间戳（毫秒）
   */
  private _startTime: number = 0;
  

  /**
   * 上一帧的时间戳（毫秒）
   */
  private _lastTime: number = 0;
  
  /**
   * 帧间隔时间（秒）- 当前帧与上一帧的时间差
   */
  private _deltaTime: number = 0;
  
  /**
   * 总运行时间（秒）- 从开始到现在的总时间
   */
  private _totalTime: number = 0;

  // 私有构造函数，防止外部直接实例化
  private constructor() {}

  /**
   * 获取单例实例
   * @returns Time类的唯一实例
   */
  static get instance(): Time {
    if (!this._instance) {
      this._instance = new Time();
    }
    return this._instance;
  }

  /**
   * 获取帧间隔时间（单位：秒）
   * 通常用于基于时间的动画和物理计算
   * @returns 当前帧与上一帧的时间差（秒）
   */
  get deltaTime(): number {
    return this._deltaTime;
  }

  /**
   * 获取总运行时间（单位：秒）
   * 从时间系统重置或首次启动到现在的总时间
   * @returns 总运行时间（秒）
   */
  get totalTime(): number {
    return this._totalTime;
  }

  /**
   * 获取开始时间戳（单位：毫秒）
   * @returns 时间系统启动时的时间戳
   */
  get startTime(): number {
    return this._startTime;
  }

  /**
   * 重置时间系统
   * 将所有时间值重置为初始状态，通常在游戏开始或重新开始时调用
   */
  reset(): void {
    this._startTime = performance.now();  // 记录重置时的时间戳
    this._lastTime = this._startTime;     // 初始化上一帧时间
    this._deltaTime = 0;                  // 重置帧间隔时间
    this._totalTime = 0;                  // 重置总运行时间
  }

  /**
   * 更新时间系统
   * 应该在每一帧调用，用于计算帧间隔时间和总运行时间
   * 通常在游戏主循环或动画循环中调用
   */
  update(): void {
    const now = performance.now();                    // 获取当前时间戳
    this._deltaTime = (now - this._lastTime) / 1000; // 计算帧间隔时间并转换为秒
    this._totalTime = (now - this._startTime) / 1000; // 计算总运行时间并转换为秒
    this._lastTime = now;                             // 更新上一帧时间戳
  }
}