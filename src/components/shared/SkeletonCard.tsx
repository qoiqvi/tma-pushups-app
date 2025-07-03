'use client';

import { FC } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { classNames } from '@/css/classnames';

interface SkeletonCardProps {
  /**
   * Show header skeleton
   * @default true
   */
  showHeader?: boolean;
  /**
   * Number of content lines to show
   * @default 2
   */
  lines?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SkeletonCard: FC<SkeletonCardProps> = ({ 
  showHeader = true, 
  lines = 2,
  className 
}) => {
  return (
    <Card className={classNames('animate-pulse', className)}>
      {showHeader && (
        <CardHeader>
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={classNames(
                'h-3 bg-muted rounded',
                index === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};