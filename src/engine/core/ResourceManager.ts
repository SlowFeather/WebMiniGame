export interface Resource {
    id: string;
    type: string;
    data: any;
  }
  
  export class ResourceManager {
    private static _instance: ResourceManager;
    private resources = new Map<string, Resource>();
    private loadingPromises = new Map<string, Promise<Resource>>();
  
    private constructor() {}
  
    static get instance(): ResourceManager {
      if (!this._instance) {
        this._instance = new ResourceManager();
      }
      return this._instance;
    }
  
    // 加载图片资源
    async loadImage(id: string, url: string): Promise<HTMLImageElement> {
      if (this.resources.has(id)) {
        return this.resources.get(id)!.data as HTMLImageElement;
      }
  
      if (this.loadingPromises.has(id)) {
        const resource = await this.loadingPromises.get(id)!;
        return resource.data as HTMLImageElement;
      }
  
      const promise = new Promise<Resource>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const resource: Resource = { id, type: 'image', data: img };
          this.resources.set(id, resource);
          resolve(resource);
        };
        img.onerror = reject;
        img.src = url;
      });
  
      this.loadingPromises.set(id, promise);
      const resource = await promise;
      this.loadingPromises.delete(id);
      
      return resource.data as HTMLImageElement;
    }
  
    // 加载音频资源
    async loadAudio(id: string, url: string): Promise<HTMLAudioElement> {
      if (this.resources.has(id)) {
        return this.resources.get(id)!.data as HTMLAudioElement;
      }
  
      const audio = new Audio(url);
      await audio.load();
      
      const resource: Resource = { id, type: 'audio', data: audio };
      this.resources.set(id, resource);
      
      return audio;
    }
  
    // 加载JSON资源
    async loadJSON(id: string, url: string): Promise<any> {
      if (this.resources.has(id)) {
        return this.resources.get(id)!.data;
      }
  
      const response = await fetch(url);
      const data = await response.json();
      
      const resource: Resource = { id, type: 'json', data };
      this.resources.set(id, resource);
      
      return data;
    }
  
    // 获取资源
    get<T = any>(id: string): T | null {
      const resource = this.resources.get(id);
      return resource ? resource.data as T : null;
    }
  
    // 删除资源
    remove(id: string): void {
      this.resources.delete(id);
    }
  
    // 清理所有资源
    clear(): void {
      this.resources.clear();
      this.loadingPromises.clear();
    }
  }
  