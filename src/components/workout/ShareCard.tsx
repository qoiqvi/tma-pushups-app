'use client';

import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Download, Loader2, ExternalLink, Eye } from 'lucide-react';

interface WorkoutPhoto {
  id: string;
  original_url: string;
  processed_url?: string;
  stats_overlay_applied: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface WorkoutData {
  id: string;
  started_at: string;
  total_reps: number;
  total_sets: number;
  duration_seconds?: number;
}

interface ShareCardProps {
  workout: WorkoutData;
  photo?: WorkoutPhoto;
  onRefreshPhoto?: () => void;
  className?: string;
}

export const ShareCard: FC<ShareCardProps> = ({
  workout,
  photo,
  onRefreshPhoto,
  className
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Сегодня';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0 мин';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} мин`;
  };

  const getShareText = () => {
    const date = formatDate(workout.started_at);
    const duration = formatDuration(workout.duration_seconds);
    
    return `💪 Тренировка завершена!

📊 Результаты ${date}:
• ${workout.total_reps} повторений
• ${workout.total_sets} подходов
• ${duration} времени

Отслеживаю прогресс с Pushups Tracker! 🚀`;
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const shareText = getShareText();
      const shareUrl = photo?.processed_url || photo?.original_url;
      
      // Use Telegram's native sharing if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.shareUrl) {
        if (shareUrl) {
          // Share with image
          window.Telegram.WebApp.shareUrl(shareUrl, shareText);
        } else {
          // Share text only
          window.Telegram.WebApp.shareUrl(window.location.href, shareText);
        }
      } 
      // Fallback to Web Share API
      else if (navigator.share) {
        const shareData: any = {
          title: 'Pushups Tracker - Результат тренировки',
          text: shareText,
          url: window.location.href
        };
        
        // Add image if available and supported
        if (shareUrl && navigator.canShare) {
          try {
            const response = await fetch(shareUrl);
            const blob = await response.blob();
            const file = new File([blob], 'workout.jpg', { type: blob.type });
            
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch (e) {
            // If image sharing fails, share without image
            console.warn('Failed to prepare image for sharing:', e);
          }
        }
        
        await navigator.share(shareData);
      }
      // Fallback to clipboard
      else {
        await navigator.clipboard.writeText(shareText);
        alert('Результат скопирован в буфер обмена!');
      }
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(getShareText());
        alert('Результат скопирован в буфер обмена!');
      } catch (e) {
        alert('Ошибка при попытке поделиться результатом');
      }
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!photo?.processed_url && !photo?.original_url) return;
    
    setIsDownloading(true);
    
    try {
      const imageUrl = photo.processed_url || photo.original_url;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pushups-workout-${workout.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Ошибка при скачивании изображения');
      
      // Haptic feedback if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const getProcessingStatus = () => {
    if (!photo) return null;
    
    switch (photo.processing_status) {
      case 'pending':
        return { text: 'Обработка...', color: 'text-amber-600' };
      case 'processing':
        return { text: 'Обработка...', color: 'text-amber-600' };
      case 'completed':
        return { text: 'Готово к публикации', color: 'text-green-600' };
      case 'failed':
        return { text: 'Ошибка обработки', color: 'text-destructive' };
      default:
        return null;
    }
  };

  const status = getProcessingStatus();
  const imageUrl = photo?.processed_url || photo?.original_url;
  const canShare = photo?.processing_status === 'completed' || !photo;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Поделиться результатом
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo preview */}
        {imageUrl && (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Workout result"
                className="w-full h-48 object-cover rounded-lg border border-border"
              />
              
              {/* Processing overlay */}
              {photo && photo.processing_status !== 'completed' && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    {photo.processing_status === 'processing' || photo.processing_status === 'pending' ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Добавляем статистику...</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm">Обработка не удалась</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onRefreshPhoto}
                          className="text-white hover:bg-white/20 mt-2"
                        >
                          Повторить
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status indicator */}
            {status && (
              <div className={`text-sm text-center ${status.color}`}>
                {status.text}
              </div>
            )}
          </div>
        )}

        {/* Share text preview */}
        <div className="bg-accent/50 rounded-lg p-3">
          <div className="text-sm text-muted-foreground mb-2">
            Текст для публикации:
          </div>
          <div className="text-sm whitespace-pre-line">
            {getShareText()}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleShare}
            disabled={!canShare || isSharing}
            className="w-full bg-pink-gradient hover:opacity-90"
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Подготовка...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Поделиться в Telegram
              </>
            )}
          </Button>

          {imageUrl && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Скачать
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open(imageUrl, '_blank')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Просмотр
              </Button>
            </div>
          )}
        </div>

        {/* Hint */}
        {!photo && (
          <div className="text-center text-sm text-muted-foreground">
            💡 Добавьте фото выше для более красивой публикации
          </div>
        )}
      </CardContent>
    </Card>
  );
};