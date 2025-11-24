# 图片压缩配置指南

## 功能说明

现在你可以在管理页面手动调整图片压缩参数，根据实际需求优化图片大小和质量。

## 使用步骤

### 1. 创建数据库表

首先需要在 Supabase 中创建配置表。在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 创建图片压缩配置表
CREATE TABLE IF NOT EXISTS compression_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO compression_config (config_key, config_value) 
VALUES (
  'default',
  '{
    "small": {
      "maxWidth": 1920,
      "maxHeight": 1080,
      "quality": 0.8,
      "threshold": 1000
    },
    "medium": {
      "maxWidth": 1600,
      "maxHeight": 900,
      "quality": 0.7,
      "threshold": 2000
    },
    "large": {
      "maxWidth": 1400,
      "maxHeight": 800,
      "quality": 0.65,
      "threshold": 999999
    }
  }'::jsonb
)
ON CONFLICT (config_key) DO NOTHING;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_compression_config_updated_at
BEFORE UPDATE ON compression_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

或者直接运行项目根目录下的 `supabase/compression_config.sql` 文件。

### 2. 访问配置页面

1. 打开管理页面 (`/admin`)
2. 点击右上角的 **"压缩配置"** 按钮
3. 配置面板会展开显示三个压缩预设

### 3. 配置说明

系统根据图片大小自动选择压缩预设：

#### 小图配置
- **阈值**: 小于 1000KB（约2.5MP）
- **适用场景**: 简单物品、小场景
- **参数**:
  - 最大宽度: 1920px
  - 最大高度: 1080px
  - 质量: 0.8

#### 中等图配置
- **阈值**: 1000KB - 2000KB（约2.5-5MP）
- **适用场景**: 中等复杂场景
- **参数**:
  - 最大宽度: 1600px
  - 最大高度: 900px
  - 质量: 0.7

#### 大图配置
- **阈值**: 大于 2000KB（约5MP+）
- **适用场景**: 人像、复杂场景
- **参数**:
  - 最大宽度: 1400px
  - 最大高度: 800px
  - 质量: 0.65

### 4. 调整参数

1. 在配置面板中修改任意参数
2. 点击 **"保存配置"** 按钮
3. 配置会立即生效（下次拍照时使用新配置）

### 5. 参数说明

- **最大宽度/高度**: 图片压缩后的最大尺寸（像素）
  - 值越小，文件越小，但可能影响清晰度
  - 建议范围: 800-1920px

- **质量**: JPEG压缩质量（0-1）
  - 0.5-0.6: 低质量，文件很小
  - 0.7-0.8: 中等质量，平衡大小和质量
  - 0.9-1.0: 高质量，文件较大
  - 建议范围: 0.6-0.8

- **阈值**: 判断使用哪个预设的图片大小（KB）
  - 根据图片原始大小（ImageData）判断
  - 可以调整以改变预设的切换点

## 优化建议

### 如果图片太大（>100KB）

1. **降低质量**: 将质量从 0.8 降到 0.7 或 0.65
2. **减小尺寸**: 将最大宽度/高度降低 200-400px
3. **调整阈值**: 降低阈值，让更多图片使用更激进的压缩

### 如果图片质量不够

1. **提高质量**: 将质量从 0.65 提高到 0.7 或 0.75
2. **增大尺寸**: 将最大宽度/高度提高 200-400px
3. **调整阈值**: 提高阈值，让更多图片使用更高质量的压缩

### 针对人像优化

如果人像照片太大，可以：
1. 降低大图配置的质量到 0.6-0.65
2. 减小大图配置的尺寸到 1200x700
3. 降低中等图阈值到 1500，让更多人像使用大图配置

## 注意事项

1. **配置缓存**: 配置有5分钟缓存，保存后可能需要等待几秒才生效
2. **默认值**: 如果配置加载失败，会使用代码中的默认值
3. **测试**: 修改配置后建议测试拍照，查看实际效果
4. **备份**: 建议记录修改前的配置值，以便回退

## 技术细节

- 配置存储在 Supabase 的 `compression_config` 表中
- 配置通过 API (`/api/compression-config`) 读取和更新
- 配置在客户端缓存5分钟，减少数据库查询
- 图片大小根据 ImageData 的像素数估算（width × height × 4 bytes）

