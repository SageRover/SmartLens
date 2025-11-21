// 图片识别结果缓存
interface CacheEntry {
  result: any;
  timestamp: number;
  hash: string;
}

class ImageRecognitionCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  private readonly MAX_CACHE_SIZE = 100;

  // 生成图片哈希（简单版本，可以优化为更精确的算法）
  private generateHash(imageBuffer: ArrayBuffer): string {
    const view = new Uint8Array(imageBuffer);
    let hash = '';
    
    // 使用前1KB和后1KB的数据生成快速哈希
    const sampleSize = Math.min(1024, view.length);
    
    // 采样前半部分
    for (let i = 0; i < sampleSize; i += 8) {
      hash += view[i].toString(16).padStart(2, '0');
    }
    
    // 采样后半部分
    if (view.length > 2048) {
      const start = view.length - sampleSize;
      for (let i = start; i < view.length; i += 8) {
        hash += view[i].toString(16).padStart(2, '0');
      }
    }
    
    return hash;
  }

  // 获取缓存结果
  get(imageBuffer: ArrayBuffer): any | null {
    const hash = this.generateHash(imageBuffer);
    const entry = this.cache.get(hash);
    
    if (!entry) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(hash);
      return null;
    }
    
    console.log("使用缓存的识别结果");
    return entry.result;
  }

  // 存储识别结果
  set(imageBuffer: ArrayBuffer, result: any): void {
    const hash = this.generateHash(imageBuffer);
    
    // 清理过期缓存
    this.cleanup();
    
    // 检查缓存大小限制
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(hash, {
      result,
      timestamp: Date.now(),
      hash
    });
    
    console.log(`缓存识别结果，当前缓存大小: ${this.cache.size}`);
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
    console.log("识别缓存已清空");
  }

  // 获取缓存统计
  getStats(): { size: number; oldestTimestamp: number | null } {
    if (this.cache.size === 0) {
      return { size: 0, oldestTimestamp: null };
    }

    let oldestTimestamp = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      oldestTimestamp
    };
  }
}

// 单例模式
export const imageCache = new ImageRecognitionCache();