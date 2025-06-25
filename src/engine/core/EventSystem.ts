/**
 * 事件优先级枚举
 * 数值越小优先级越高
 */
export enum EventPriority {
  CRITICAL = 0,    // 关键系统事件（引擎生命周期）
  HIGH = 1,        // 高优先级（输入处理、碰撞检测）
  NORMAL = 2,      // 正常优先级（游戏逻辑）
  LOW = 3,         // 低优先级（UI更新、音效）
  BACKGROUND = 4   // 后台处理（统计、日志）
}

/**
 * 事件执行时机枚举
 */
export enum EventTiming {
  IMMEDIATE = 'immediate',     // 立即执行
  PRE_UPDATE = 'pre_update',   // 更新前执行
  UPDATE = 'update',           // 更新时执行
  POST_UPDATE = 'post_update', // 更新后执行
  RENDER = 'render',           // 渲染时执行
  END_FRAME = 'end_frame'      // 帧结束时执行
}

/**
 * 事件处理函数类型
 */
type GameEventHandler = (...args: any[]) => void;

/**
 * 异步事件处理函数类型
 */
type AsyncGameEventHandler = (...args: any[]) => Promise<void>;

/**
 * 事件监听器配置
 */
interface EventListener {
  handler: GameEventHandler | AsyncGameEventHandler;
  priority: EventPriority;
  timing: EventTiming;
  once: boolean;
  enabled: boolean;
  id: string;
}

/**
 * 事件性能统计
 */
interface EventStats {
  totalCalls: number;
  totalTime: number;
  averageTime: number;
  maxTime: number;
  lastCallTime: number;
}

/**
 * 游戏引擎专用事件系统
 * 针对游戏循环优化，支持优先级、时机控制和性能监控
 */
export class EventSystem {
  private static _instance: EventSystem;
  
  // 事件存储：事件名 -> 监听器数组
  private events = new Map<string, EventListener[]>();
  
  // 延迟执行队列：按执行时机分组
  private deferredEvents = new Map<EventTiming, Array<{
    event: string;
    args: any[];
    timestamp: number;
  }>>();
  
  // 性能统计
  private stats = new Map<string, EventStats>();
  
  // 配置选项
  private maxEventProcessingTime = 5; // 每帧最大事件处理时间（毫秒）
  private performanceTracking = true;
  private debugMode = false;
  
  // 事件ID生成器
  private nextListenerId = 0;

  private constructor() {
    this.initializeDeferredQueues();
  }

  static get instance(): EventSystem {
    if (!this._instance) {
      this._instance = new EventSystem();
    }
    return this._instance;
  }

  /**
   * 初始化延迟执行队列
   */
  private initializeDeferredQueues(): void {
    Object.values(EventTiming).forEach(timing => {
      this.deferredEvents.set(timing, []);
    });
  }

  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理函数
   * @param options 配置选项
   * @returns 取消订阅函数
   */
  on(
    event: string,
    handler: GameEventHandler | AsyncGameEventHandler,
    options: {
      priority?: EventPriority;
      timing?: EventTiming;
      once?: boolean;
    } = {}
  ): () => void {
    const listener: EventListener = {
      handler,
      priority: options.priority ?? EventPriority.NORMAL,
      timing: options.timing ?? EventTiming.IMMEDIATE,
      once: options.once ?? false,
      enabled: true,
      id: `listener_${++this.nextListenerId}`
    };

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event)!;
    listeners.push(listener);
    
    // 按优先级排序（优先级数值越小越靠前）
    listeners.sort((a, b) => a.priority - b.priority);

    if (this.debugMode) {
      console.log(`[GameEventSystem] 注册事件监听器: ${event}, 优先级: ${listener.priority}, 时机: ${listener.timing}`);
    }

    // 返回取消订阅函数
    return () => this.off(event, listener.id);
  }

  /**
   * 一次性事件订阅
   */
  once(
    event: string,
    handler: GameEventHandler | AsyncGameEventHandler,
    options: {
      priority?: EventPriority;
      timing?: EventTiming;
    } = {}
  ): () => void {
    return this.on(event, handler, { ...options, once: true });
  }

  /**
   * 取消事件订阅
   */
  off(event: string, listenerId: string): void {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.findIndex(l => l.id === listenerId);
      if (index > -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.events.delete(event);
        }
      }
    }
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param args 事件参数
   * @param forceTiming 强制指定执行时机
   */
  emit(event: string, ...args: any[]): boolean;
  emit(event: string, forceTiming: EventTiming, ...args: any[]): boolean;
  emit(event: string, timingOrFirstArg?: EventTiming | any, ...restArgs: any[]): boolean {
    let timing: EventTiming | undefined;
    let actualArgs: any[];

    // 参数解析
    if (typeof timingOrFirstArg === 'string' && Object.values(EventTiming).includes(timingOrFirstArg as EventTiming)) {
      timing = timingOrFirstArg as EventTiming;
      actualArgs = restArgs;
    } else {
      actualArgs = timingOrFirstArg !== undefined ? [timingOrFirstArg, ...restArgs] : restArgs;
    }

    const listeners = this.events.get(event);
    if (!listeners || listeners.length === 0) {
      return false;
    }

    // 过滤启用的监听器
    const activeListeners = listeners.filter(l => l.enabled);
    if (activeListeners.length === 0) {
      return false;
    }

    let executed = false;

    for (const listener of activeListeners) {
      const effectiveTiming = timing || listener.timing;

      if (effectiveTiming === EventTiming.IMMEDIATE) {
        // 立即执行
        this.executeListener(event, listener, actualArgs);
        executed = true;
      } else {
        // 添加到延迟执行队列
        const deferredQueue = this.deferredEvents.get(effectiveTiming);
        if (deferredQueue) {
          deferredQueue.push({
            event,
            args: actualArgs,
            timestamp: performance.now()
          });
          executed = true;
        }
      }

      // 处理一次性监听器
      if (listener.once) {
        this.off(event, listener.id);
      }
    }

    return executed;
  }

  /**
   * 执行指定时机的延迟事件
   * 应该在游戏循环的相应阶段调用
   */
  processDeferredEvents(timing: EventTiming): void {
    const queue = this.deferredEvents.get(timing);
    if (!queue || queue.length === 0) {
      return;
    }

    const startTime = performance.now();
    let processedEvents = 0;

    // 处理队列中的事件，但限制处理时间
    while (queue.length > 0 && (performance.now() - startTime) < this.maxEventProcessingTime) {
      const deferredEvent = queue.shift()!;
      const listeners = this.events.get(deferredEvent.event);
      
      if (listeners) {
        const relevantListeners = listeners.filter(l => 
          l.enabled && (l.timing === timing || timing === EventTiming.IMMEDIATE)
        );

        for (const listener of relevantListeners) {
          this.executeListener(deferredEvent.event, listener, deferredEvent.args);
          
          if (listener.once) {
            this.off(deferredEvent.event, listener.id);
          }
        }
      }
      
      processedEvents++;
    }

    if (this.debugMode && processedEvents > 0) {
      const processingTime = performance.now() - startTime;
      console.log(`[GameEventSystem] 处理 ${timing} 事件: ${processedEvents} 个, 耗时: ${processingTime.toFixed(2)}ms`);
    }

    // 如果还有未处理的事件，在下一帧继续处理
    if (queue.length > 0) {
      console.warn(`[GameEventSystem] ${timing} 队列中还有 ${queue.length} 个事件未处理，将在下一帧继续`);
    }
  }

  /**
   * 执行单个监听器
   */
  private executeListener(event: string, listener: EventListener, args: any[]): void {
    const startTime = this.performanceTracking ? performance.now() : 0;

    try {
      const result = listener.handler(...args);
      
      // 处理异步事件（在游戏引擎中通常要避免）
      if (result instanceof Promise) {
        console.warn(`[GameEventSystem] 事件 "${event}" 的处理函数是异步的，这可能影响游戏性能`);
        result.catch(error => {
          console.error(`[GameEventSystem] 异步事件处理出错 "${event}":`, error);
        });
      }
    } catch (error) {
      console.error(`[GameEventSystem] 事件处理出错 "${event}":`, error);
    }

    // 性能统计
    if (this.performanceTracking) {
      const executionTime = performance.now() - startTime;
      this.updateStats(event, executionTime);
    }
  }

  /**
   * 更新性能统计
   */
  private updateStats(event: string, executionTime: number): void {
    let stats = this.stats.get(event);
    if (!stats) {
      stats = {
        totalCalls: 0,
        totalTime: 0,
        averageTime: 0,
        maxTime: 0,
        lastCallTime: 0
      };
      this.stats.set(event, stats);
    }

    stats.totalCalls++;
    stats.totalTime += executionTime;
    stats.averageTime = stats.totalTime / stats.totalCalls;
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.lastCallTime = executionTime;
  }

  /**
   * 获取事件性能统计
   */
  getEventStats(event?: string): Map<string, EventStats> | EventStats | undefined {
    if (event) {
      return this.stats.get(event);
    }
    return new Map(this.stats);
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): { event: string; stats: EventStats }[] {
    return Array.from(this.stats.entries())
      .map(([event, stats]) => ({ event, stats }))
      .sort((a, b) => b.stats.totalTime - a.stats.totalTime);
  }

  /**
   * 暂停/恢复指定事件
   */
  setEventEnabled(event: string, enabled: boolean): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        listener.enabled = enabled;
      });
    }
  }

  /**
   * 清理过期的延迟事件
   */
  cleanupExpiredEvents(maxAge: number = 1000): void {
    const now = performance.now();
    
    for (const [timing, queue] of this.deferredEvents) {
      const originalLength = queue.length;
      const filteredQueue = queue.filter(event => now - event.timestamp < maxAge);
      
      if (filteredQueue.length !== originalLength) {
        this.deferredEvents.set(timing, filteredQueue);
        console.warn(`[GameEventSystem] 清理了 ${originalLength - filteredQueue.length} 个过期的 ${timing} 事件`);
      }
    }
  }

  /**
   * 配置系统参数
   */
  configure(options: {
    maxEventProcessingTime?: number;
    performanceTracking?: boolean;
    debugMode?: boolean;
  }): void {
    if (options.maxEventProcessingTime !== undefined) {
      this.maxEventProcessingTime = options.maxEventProcessingTime;
    }
    if (options.performanceTracking !== undefined) {
      this.performanceTracking = options.performanceTracking;
    }
    if (options.debugMode !== undefined) {
      this.debugMode = options.debugMode;
    }
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): {
    totalEvents: number;
    totalListeners: number;
    deferredEventCount: { [key in EventTiming]: number };
    performanceTracking: boolean;
    debugMode: boolean;
  } {
    let totalListeners = 0;
    for (const listeners of this.events.values()) {
      totalListeners += listeners.length;
    }

    const deferredEventCount = {} as { [key in EventTiming]: number };
    for (const [timing, queue] of this.deferredEvents) {
      deferredEventCount[timing] = queue.length;
    }

    return {
      totalEvents: this.events.size,
      totalListeners,
      deferredEventCount,
      performanceTracking: this.performanceTracking,
      debugMode: this.debugMode
    };
  }

  /**
   * 清理所有事件和统计
   */
  clear(): void {
    this.events.clear();
    this.stats.clear();
    this.initializeDeferredQueues();
  }

  /**
   * 销毁事件系统
   */
  static destroy(): void {
    if (this._instance) {
      this._instance.clear();
      this._instance = null as any;
    }
  }
}