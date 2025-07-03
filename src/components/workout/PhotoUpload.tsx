'use client';

import { FC, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Upload, X, Loader2, AlertCircle } from 'lucide-react';

interface PhotoUploadProps {
  workoutId: string;
  onPhotoUploaded?: (photoUrl: string, photoId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const PhotoUpload: FC<PhotoUploadProps> = ({
  workoutId,
  onPhotoUploaded,
  onError,
  className
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('Файл слишком большой. Максимум 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('workoutId', workoutId);

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки фото');
      }

      const result = await response.json();
      onPhotoUploaded?.(result.original_url, result.id);

      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки фото';
      setUploadError(errorMessage);
      onError?.(errorMessage);

      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUploadError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Добавить фото
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Preview or upload buttons */}
        {previewUrl ? (
          <div className="space-y-4">
            {/* Photo preview */}
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-border"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemovePhoto}
                disabled={isUploading}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload button */}
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-pink-gradient hover:opacity-90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загружаем...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Загрузить фото
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload options */}
            <div className="grid gap-3">
              <Button
                variant="outline"
                onClick={handleCameraCapture}
                disabled={isUploading}
                className="h-auto py-4 flex-col gap-2"
              >
                <Camera className="h-6 w-6 text-primary" />
                <span>Сделать фото</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleGallerySelect}
                disabled={isUploading}
                className="h-auto py-4 flex-col gap-2"
              >
                <ImageIcon className="h-6 w-6 text-primary" />
                <span>Выбрать из галереи</span>
              </Button>
            </div>

            {/* Info text */}
            <div className="text-center text-sm text-muted-foreground">
              Добавьте фото тренировки, чтобы поделиться результатом
            </div>
          </div>
        )}

        {/* Error message */}
        {uploadError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{uploadError}</span>
          </div>
        )}

        {/* File size limit info */}
        <div className="text-xs text-muted-foreground text-center">
          Максимальный размер файла: 5MB
        </div>
      </CardContent>
    </Card>
  );
};