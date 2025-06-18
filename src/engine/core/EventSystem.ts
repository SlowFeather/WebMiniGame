type EventHandler = (...args: any[]) => void;

export class EventSystem {
  private static _instance: EventSystem;
  private events = new Map<string, Set<EventHandler>>();

  private constructor() {}

  static get instance(): EventSystem {
    if (!this._instance) {
      this._instance = new EventSystem();
    }
    return this._instance;
  }

  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  clear(): void {
    this.events.clear();
  }
}