export class Time {
    private static _instance: Time;
    private _startTime: number = 0;
    private _lastTime: number = 0;
    private _deltaTime: number = 0;
    private _totalTime: number = 0;
  
    private constructor() {}
  
    static get instance(): Time {
      if (!this._instance) {
        this._instance = new Time();
      }
      return this._instance;
    }
  
    get deltaTime(): number {
      return this._deltaTime;
    }
  
    get totalTime(): number {
      return this._totalTime;
    }
  
    get startTime(): number {
      return this._startTime;
    }
  
    reset(): void {
      this._startTime = performance.now();
      this._lastTime = this._startTime;
      this._deltaTime = 0;
      this._totalTime = 0;
    }
  
    update(): void {
      const now = performance.now();
      this._deltaTime = (now - this._lastTime) / 1000; // Convert to seconds
      this._totalTime = (now - this._startTime) / 1000;
      this._lastTime = now;
    }
  }