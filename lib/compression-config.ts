// 图片压缩配置管理

export interface CompressionPreset {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  threshold: number; // KB阈值（用于判断使用哪个预设）
}

export interface CompressionConfig {
  small: CompressionPreset;
  medium: CompressionPreset;
  large: CompressionPreset;
}

// 默认配置
export const defaultConfig: CompressionConfig = {
  small: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    threshold: 1000,
  },
  medium: {
    maxWidth: 1600,
    maxHeight: 900,
    quality: 0.7,
    threshold: 2000,
  },
  large: {
    maxWidth: 1400,
    maxHeight: 800,
    quality: 0.65,
    threshold: 999999,
  },
};

// 获取配置（带缓存）
let cachedConfig: CompressionConfig | null = null;
let configFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export async function getCompressionConfig(): Promise<CompressionConfig> {
  // 如果缓存有效，直接返回
  if (cachedConfig && Date.now() - configFetchTime < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const response = await fetch("/api/compression-config");
    if (response.ok) {
      const config = await response.json();
      cachedConfig = config;
      configFetchTime = Date.now();
      return config;
    }
  } catch (error) {
    console.warn("获取压缩配置失败，使用默认配置:", error);
  }

  // 返回默认配置
  return defaultConfig;
}

// 清除缓存（配置更新后调用）
export function clearConfigCache() {
  cachedConfig = null;
  configFetchTime = 0;
}

