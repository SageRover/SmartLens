"use client";

import { useState, useEffect } from "react";
import { supabase, type RecognitionRecord } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

export default function AdminPage() {
  const [records, setRecords] = useState<RecognitionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<RecognitionRecord[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchQuery, dateFilter]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recognition_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error("加载记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    // 按搜索关键词过滤
    if (searchQuery) {
      filtered = filtered.filter((record) =>
        record.recognition_result
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    // 按日期过滤
    if (dateFilter) {
      filtered = filtered.filter((record) => {
        const recordDate = format(new Date(record.created_at), "yyyy-MM-dd");
        return recordDate === dateFilter;
      });
    }

    setFilteredRecords(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("");
  };

  const openPreview = (url: string, title: string) => {
    setPreviewImage({ url, title });
  };

  const closePreview = () => setPreviewImage(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">识别记录管理</h1>
          </div>

          {/* 筛选控件 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索识别结果..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            {(searchQuery || dateFilter) && (
              <Button variant="outline" onClick={clearFilters}>
                清除筛选
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {records.length === 0
                ? "暂无识别记录"
                : "没有找到匹配的记录"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {record.recognition_result}
                    </CardTitle>
                    <span className="text-sm text-gray-500">
                      {format(new Date(record.created_at), "yyyy-MM-dd HH:mm")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 物品照片 */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">物品照片</p>
                      <button
                        type="button"
                        onClick={() =>
                          openPreview(
                            record.item_image_url,
                            `${record.recognition_result} - 物品照片`
                          )
                        }
                        className="group relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Image
                          src={record.item_image_url}
                          alt={record.recognition_result}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                          unoptimized
                        />
                        <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">
                          点击放大
                        </span>
                      </button>
                    </div>

                    {/* 人脸照片 */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">人脸照片</p>
                      {record.face_image_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            openPreview(record.face_image_url, "人脸照片")
                          }
                          className="group relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <Image
                            src={record.face_image_url}
                            alt="人脸"
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                            unoptimized
                          />
                          <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">
                            点击放大
                          </span>
                        </button>
                      ) : (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-400 text-sm">未拍摄</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <p className="text-white text-sm">{previewImage.title}</p>
              <button
                type="button"
                onClick={closePreview}
                className="text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative w-full h-[60vh] min-h-[300px]">
              <Image
                src={previewImage.url}
                alt={previewImage.title}
                fill
                className="object-contain bg-black"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

