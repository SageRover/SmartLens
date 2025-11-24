# Token预加载和Web Worker优化

## 优化内容

### 1. Token预加载优化 ✅

**问题**：
- 之前Token在模块加载时预加载，但可能不够可靠
- 每次识别请求都需要等待Token获取（300-400ms）

**优化方案**：
- 在API路由初始化时主动预加载Token
- 添加预加载状态管理，避免重复预加载
- 服务器端延迟1秒预加载，避免阻塞启动

**位置**：
- `lib/baidu-optimized.ts` - 添加 `preloadBaiduToken()` 函数
- `app/api/recognize-optimized/route.ts` - 在路由初始化时预加载

**效果**：
- Token在API路由初始化时就开始获取
- 用户第一次识别时Token可能已经准备好
- 减少识别请求的等待时间

### 2. Web Worker图片压缩 ✅

**问题**：
- 图片压缩在主线程进行，可能阻塞UI
- 大图片压缩时用户界面可能卡顿

**优化方案**：
- 使用Web Worker在后台线程处理图片压缩
- 不阻塞主线程，保持UI流畅
- 自动降级：如果Worker失败，使用主线程压缩

**文件结构**：
- `public/image-compress.worker.js` - Web Worker脚本
- `lib/image-compress-worker.ts` - Worker封装工具
- `hooks/useCamera.ts` - 使用Worker压缩图片

**特性**：
- 后台线程处理，不阻塞UI
- 使用OffscreenCanvas，性能更好
- 自动降级机制，兼容性更好
- 使用transferable传递数据，提高性能

**效果**：
- 图片压缩不阻塞主线程
- UI保持流畅响应
- 压缩性能更好（OffscreenCanvas）

## 使用方式

### Token预加载

Token会在以下时机自动预加载：
1. 服务器端：模块加载后1秒（避免阻塞启动）
2. API路由：路由初始化时
3. 识别请求：如果Token未预加载，会在使用时获取

无需手动调用，系统会自动处理。

### Web Worker图片压缩

在 `useCamera.ts` 中自动使用：

```typescript
// 自动使用Web Worker压缩
const compressedBlob = await compressImageInWorker(imageData, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85
});
```

如果Worker不可用，会自动降级到主线程压缩。

## 性能提升

### Token预加载
- **之前**：每次识别等待300-400ms获取Token
- **现在**：Token可能已预加载，识别更快

### Web Worker压缩
- **之前**：主线程压缩，可能阻塞UI
- **现在**：后台线程压缩，UI保持流畅

## 注意事项

1. **Worker兼容性**：如果浏览器不支持Worker，会自动降级
2. **Token缓存**：Token会缓存，避免频繁请求
3. **错误处理**：所有优化都有错误处理和降级机制

## 测试建议

1. 测试Token预加载：查看服务器日志，确认Token在路由初始化时预加载
2. 测试Worker压缩：打开浏览器开发者工具，查看Network标签，确认Worker文件加载
3. 测试降级机制：禁用Worker，确认自动降级到主线程压缩

