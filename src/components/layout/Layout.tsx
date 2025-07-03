'use client';

import { FC, PropsWithChildren } from 'react';
import { Page } from '@/components/Page';
import { Navigation } from './Navigation';

interface LayoutProps {
  /**
   * True if it is allowed to go back from this page.
   * @default false for main navigation pages
   */
  back?: boolean;
  /**
   * Show bottom navigation
   * @default true
   */
  showNavigation?: boolean;
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ 
  children, 
  back = false,
  showNavigation = true 
}) => {
  return (
    <Page back={back}>
      <div className="min-h-screen bg-background">
        {/* Main content area with bottom padding for navigation */}
        <main className={showNavigation ? 'pb-20' : ''}>
          {children}
        </main>
        
        {/* Bottom navigation */}
        {showNavigation && <Navigation />}
      </div>
    </Page>
  );
};