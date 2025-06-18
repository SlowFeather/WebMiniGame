export type EventCallback<T = any> = (data: T) => void;

export interface EventListener<T = any> {
    callback: EventCallback<T>;
    once?: boolean;
    priority?: number;
}

/**
 * 事件系统 - 全局事件管理
 */
export class EventSystem {
    private static instance: EventSystem;
    private listeners: Map<string, EventListener[]> = new Map();
    private eventQueue: Array<{ event: string, data: any }> = [];
    private isProcessing: boolean = false;

    constructor() {
        if (EventSystem.instance) {
            return EventSystem.instance;
        }
        EventSystem.instance = this;
    }

    public static getInstance(): EventSystem {
        if (!EventSystem.instance) {
            EventSystem.instance = new EventSystem();
        }
        return EventSystem.instance;
    }

    /**
     * 监听事件
     */
    public on<T = any>(event: string, callback: EventCallback<T>, options?: {
        once?: boolean;
        priority?: number;
    }): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const listener: EventListener<T> = {
            callback,
            once: options?.once || false,
            priority: options?.priority || 0
        };

        const listeners = this.listeners.get(event)!;
        listeners.push(listener);

        // 按优先级排序（高优先级先执行）
        listeners.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    /**
     * 监听事件一次
     */
    public once<T = any>(event: string, callback: EventCallback<T>, priority?: number): void {
        this.on(event, callback, { once: true, priority });
    }

    /**
     * 取消监听
     */
    public off<T = any>(event: string, callback?: EventCallback<T>): void {
        if (!this.listeners.has(event)) return;

        const listeners = this.listeners.get(event)!;

        if (callback) {
            // 移除特定回调
            const index = listeners.findIndex(listener => listener.callback === callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        } else {
            // 移除所有监听器
            listeners.length = 0;
        }

        // 如果没有监听器了，删除事件
        if (listeners.length === 0) {
            this.listeners.delete(event);
        }
    }

    /**
     * 立即触发事件
     */
    public emit<T = any>(event: string, data?: T): void {
        if (!this.listeners.has(event)) return;

        const listeners = this.listeners.get(event)!;
        const listenersToRemove: EventListener[] = [];

        // 防止在事件处理过程中修改监听器列表
        const currentListeners = [...listeners];

        for (const listener of currentListeners) {
            try {
                listener.callback(data);
                
                if (listener.once) {
                    listenersToRemove.push(listener);
                }
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        }

        // 移除一次性监听器
        for (const listener of listenersToRemove) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }

        // 如果没有监听器了，删除事件
        if (listeners.length === 0) {
            this.listeners.delete(event);
        }
    }

    /**
     * 延迟触发事件（加入队列）
     */
    public emitAsync<T = any>(event: string, data?: T): void {
        this.eventQueue.push({ event, data });
    }

    /**
     * 处理事件队列
     */
    public processEventQueue(): void {
        if (this.isProcessing) return;

        this.isProcessing = true;

        while (this.eventQueue.length > 0) {
            const { event, data } = this.eventQueue.shift()!;
            this.emit(event, data);
        }

        this.isProcessing = false;
    }

    /**
     * 检查是否有监听器
     */
    public hasListeners(event: string): boolean {
        return this.listeners.has(event) && this.listeners.get(event)!.length > 0;
    }

    /**
     * 获取监听器数量
     */
    public getListenerCount(event: string): number {
        return this.listeners.has(event) ? this.listeners.get(event)!.length : 0;
    }

    /**
     * 获取所有事件名称
     */
    public getEventNames(): string[] {
        return Array.from(this.listeners.keys());
    }

    /**
     * 清空所有监听器
     */
    public clear(): void {
        this.listeners.clear();
        this.eventQueue.length = 0;
    }

    /**
     * 创建命名空间事件系统
     */
    public createNamespace(namespace: string): NamespacedEventSystem {
        return new NamespacedEventSystem(this, namespace);
    }
}

/**
 * 命名空间事件系统
 */
export class NamespacedEventSystem {
    constructor(
        private eventSystem: EventSystem,
        private namespace: string
    ) {}

    private getEventName(event: string): string {
        return `${this.namespace}:${event}`;
    }

    public on<T = any>(event: string, callback: EventCallback<T>, options?: {
        once?: boolean;
        priority?: number;
    }): void {
        this.eventSystem.on(this.getEventName(event), callback, options);
    }

    public once<T = any>(event: string, callback: EventCallback<T>, priority?: number): void {
        this.eventSystem.once(this.getEventName(event), callback, priority);
    }

    public off<T = any>(event: string, callback?: EventCallback<T>): void {
        this.eventSystem.off(this.getEventName(event), callback);
    }

    public emit<T = any>(event: string, data?: T): void {
        this.eventSystem.emit(this.getEventName(event), data);
    }

    public emitAsync<T = any>(event: string, data?: T): void {
        this.eventSystem.emitAsync(this.getEventName(event), data);
    }

    public hasListeners(event: string): boolean {
        return this.eventSystem.hasListeners(this.getEventName(event));
    }

    public getListenerCount(event: string): number {
        return this.eventSystem.getListenerCount(this.getEventName(event));
    }
}

// 预定义的系统事件
export const SystemEvents = {
    // 引擎事件
    ENGINE_START: 'engine:start',
    ENGINE_STOP: 'engine:stop',
    ENGINE_PAUSE: 'engine:pause',
    ENGINE_RESUME: 'engine:resume',
    
    // 游戏循环事件
    FRAME_START: 'frame:start',
    FRAME_END: 'frame:end',
    UPDATE: 'game:update',
    RENDER: 'game:render',
    
    // 游戏对象事件
    GAMEOBJECT_CREATED: 'gameobject:created',
    GAMEOBJECT_DESTROYED: 'gameobject:destroyed',
    COMPONENT_ADDED: 'component:added',
    COMPONENT_REMOVED: 'component:removed',
    
    // 输入事件
    INPUT_KEY_DOWN: 'input:keydown',
    INPUT_KEY_UP: 'input:keyup',
    INPUT_MOUSE_DOWN: 'input:mousedown',
    INPUT_MOUSE_UP: 'input:mouseup',
    INPUT_MOUSE_MOVE: 'input:mousemove',
    INPUT_TOUCH_START: 'input:touchstart',
    INPUT_TOUCH_END: 'input:touchend',
    INPUT_TOUCH_MOVE: 'input:touchmove',
    INPUT_JOYSTICK: 'input:joystick',
    
    // 碰撞事件
    COLLISION_ENTER: 'collision:enter',
    COLLISION_EXIT: 'collision:exit',
    COLLISION_STAY: 'collision:stay',
    TRIGGER_ENTER: 'trigger:enter',
    TRIGGER_EXIT: 'trigger:exit',
    
    // 动画事件
    ANIMATION_START: 'animation:start',
    ANIMATION_END: 'animation:end',
    ANIMATION_LOOP: 'animation:loop',
    
    // 资源事件
    ASSET_LOADED: 'asset:loaded',
    ASSET_ERROR: 'asset:error',
    ASSETS_READY: 'assets:ready',
    
    // UI事件
    UI_BUTTON_CLICK: 'ui:button:click',
    UI_PANEL_OPEN: 'ui:panel:open',
    UI_PANEL_CLOSE: 'ui:panel:close',
    
    // 场景事件
    SCENE_LOAD: 'scene:load',
    SCENE_UNLOAD: 'scene:unload',
    SCENE_READY: 'scene:ready'
} as const;