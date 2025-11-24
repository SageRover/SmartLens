// 🚀 Web Worker 图片压缩工具
// 在后台线程处理图片压缩，不阻塞主线程

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface CompressResult {
  buffer: ArrayBuffer;
  size: number;
  originalSize: number;
}

class ImageCompressWorker {
  private worker: Worker | null = null;
  private workerReady: Promise<void>;
  private messageId = 0;
  private pendingMessages = new Map<number, {
    resolve: (result: CompressResult) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    this.workerReady = this.initWorker();
  }

  private async initWorker(): Promise<void> {
    try {
      // 创建Web Worker（Next.js public目录中的文件）
      this.worker = new Worker('/image-compress.worker.js', {
        type: 'classic' // 使用classic模式
      });

      // 监听Worker消息
      this.worker.onmessage = (event) => {
        const { type, data, error, messageId } = event.data;

        const pending = this.pendingMessages.get(messageId);
        if (!pending) return;

        this.pendingMessages.delete(messageId);

        if (type === 'success') {
          pending.resolve(data);
        } else {
          pending.reject(new Error(error || '压缩失败'));
        }
      };

      this.worker.onerror = (error) => {
        console.error('Web Worker错误:', error);
        // 清理所有待处理的消息
        for (const [id, pending] of this.pendingMessages.entries()) {
          pending.reject(new Error('Worker错误'));
          this.pendingMessages.delete(id);
        }
      };

      console.log('✅ 图片压缩Worker初始化成功');
    } catch (error) {
      console.error('❌ 图片压缩Worker初始化失败:', error);
      throw error;
    }
  }

  /**
   * 压缩图片（从Canvas ImageData）
   * @param imageData Canvas ImageData对象
   * @param options 压缩选项
   * @returns 压缩后的图片数据
   */
  async compressFromImageData(
    imageData: ImageData,
    options: CompressOptions = {}
  ): Promise<CompressResult> {
    await this.workerReady;

    if (!this.worker) {
      throw new Error('Worker未初始化');
    }

    const messageId = ++this.messageId;
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(messageId, { resolve, reject });

      // 发送压缩请求（传递ImageData，使用transferable优化性能）
      this.worker!.postMessage(
        {
          type: 'compress',
          messageId,
          data: {
            imageData,
            maxWidth,
            maxHeight,
            quality,
          },
        },
        [imageData.data.buffer] // 使用transferable传递，提高性能
      );

      // 超时处理（30秒）
      setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error('压缩超时'));
        }
      }, 30000);
    });
  }

  /**
   * 销毁Worker
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingMessages.clear();
    }
  }
}

// 单例模式
let workerInstance: ImageCompressWorker | null = null;

export function getImageCompressWorker(): ImageCompressWorker {
  if (!workerInstance && typeof window !== 'undefined') {
    workerInstance = new ImageCompressWorker();
  }
  return workerInstance!;
}

/**
 * 在Web Worker中压缩图片
 * @param imageData Canvas ImageData对象
 * @param options 压缩选项
 * @returns 压缩后的图片Blob
 */
export async function compressImageInWorker(
  imageData: ImageData,
  options?: CompressOptions
): Promise<Blob> {
  // 检查Worker支持
  if (typeof window === 'undefined' || !window.Worker) {
    throw new Error('浏览器不支持Web Worker');
  }

  const worker = getImageCompressWorker();
  const result = await worker.compressFromImageData(imageData, options);
  return new Blob([result.buffer], { type: 'image/jpeg' });
}

