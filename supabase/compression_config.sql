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

