-- 创建识别记录表
CREATE TABLE IF NOT EXISTS recognition_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recognition_result TEXT NOT NULL,
  item_image_url TEXT NOT NULL,
  face_image_url TEXT
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_recognition_records_created_at 
ON recognition_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recognition_records_result 
ON recognition_records(recognition_result);

-- 注意：存储桶需要在 Supabase Dashboard 中手动创建
-- Storage > Create bucket
-- 名称: images
-- 公开: true (Public bucket)

