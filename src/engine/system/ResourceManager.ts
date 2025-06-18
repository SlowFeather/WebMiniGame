type ResourceType = "image" | "audio" | "json" | "text";

interface Resource {
  url: string;
  type: ResourceType;
  data: any;
  loaded: boolean;
}

export class ResourceManager {
  private static cache: Map<string, Resource> = new Map();

  static async load(url: string, type: ResourceType = "image"): Promise<any> {
    if (this.cache.has(url)) return this.cache.get(url)!.data;

    let data: any;
    switch (type) {
      case "image":
        data = await this.loadImage(url);
        break;
      case "audio":
        data = await this.loadAudio(url);
        break;
      case "json":
        data = await (await fetch(url)).json();
        break;
      case "text":
        data = await (await fetch(url)).text();
        break;
    }

    this.cache.set(url, { url, type, data, loaded: true });
    return data;
  }

  static get(url: string): any | null {
    return this.cache.has(url) ? this.cache.get(url)!.data : null;
  }

  static clear(url?: string): void {
    if (url) this.cache.delete(url);
    else this.cache.clear();
  }

  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private static loadAudio(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadeddata = () => resolve(audio);
      audio.onerror = reject;
      audio.src = url;
    });
  }
}
