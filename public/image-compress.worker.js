// 🚀 Web Worker: 图片压缩处理
// 在后台线程处理图片压缩，不阻塞主线程

/**
 * 压缩图片（使用OffscreenCanvas）
 * @param {ImageBitmap} imageBitmap - 图片位图
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @param {number} quality - JPEG质量 (0-1)
 * @returns {Promise<Blob>} 压缩后的图片Blob
 */
function compressImage(imageBitmap, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    try {
      // 计算缩放比例
      let width = imageBitmap.width;
      let height = imageBitmap.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      // 创建OffscreenCanvas并绘制
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      ctx.drawImage(imageBitmap, 0, 0, width, height);

      // 转换为Blob
      canvas.convertToBlob({
        type: 'image/jpeg',
        quality: quality
      }).then(resolve).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

// 监听主线程消息
self.addEventListener('message', async (event) => {
  const { type, data, messageId } = event.data;

  try {
    if (type === 'compress') {
      const { imageData, maxWidth, maxHeight, quality } = data;
      
      // ImageData通过transferable传递，直接使用
      // 从ImageData创建ImageBitmap
      const imageBitmap = await createImageBitmap(imageData);
      
      // 压缩图片
      const compressedBlob = await compressImage(imageBitmap, maxWidth, maxHeight, quality);
      
      // 转换为ArrayBuffer
      const compressedBuffer = await compressedBlob.arrayBuffer();
      
      // 发送压缩结果
      self.postMessage({
        type: 'success',
        messageId: messageId,
        data: {
          buffer: compressedBuffer,
          size: compressedBuffer.byteLength,
          originalSize: imageData.data.byteLength
        }
      });
      
      // 清理
      imageBitmap.close();
    } else {
      self.postMessage({
        type: 'error',
        messageId: messageId,
        error: `未知的消息类型: ${type}`
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      messageId: messageId,
      error: error.message || '压缩失败'
    });
  }
});

