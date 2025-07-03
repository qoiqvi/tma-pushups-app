'use client';

import { FC, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Crown, Star } from 'lucide-react';
import { TelegramUser } from '@/types/telegram';

interface ProfileSectionProps {
  className?: string;
}

export const ProfileSection: FC<ProfileSectionProps> = ({ className }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    // Get user data from Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (telegramUser) {
        setUser(telegramUser);
      }
    }
  }, []);

  const getUserDisplayName = () => {
    if (!user) return 'Пользователь';
    
    const parts = [];
    if (user.first_name) parts.push(user.first_name);
    if (user.last_name) parts.push(user.last_name);
    
    return parts.length > 0 ? parts.join(' ') : (user.username || 'Пользователь');
  };

  const getUserInitials = () => {
    if (!user) return 'П';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    } else if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    
    return 'П';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Профиль
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-pink-gradient flex items-center justify-center text-white font-bold text-lg">
                {getUserInitials()}
              </div>
            )}
            
            {/* Premium badge */}
            {user?.is_premium && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">
                {getUserDisplayName()}
              </h3>
              {user?.is_premium && (
                <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            
            {user?.username && (
              <p className="text-sm text-muted-foreground truncate">
                @{user.username}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {user?.language_code && (
                <span>
                  🌐 {user.language_code.toUpperCase()}
                </span>
              )}
              
              {user?.is_premium && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <Crown className="h-3 w-3" />
                  Premium
                </span>
              )}
            </div>
          </div>
        </div>

        {/* User ID (for debugging) */}
        {user?.id && process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              ID: {user.id}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};