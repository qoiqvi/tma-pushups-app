'use client';

import { FC, ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            maxWidth: '400px',
          },
          
          // Success toasts
          success: {
            duration: 3000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--primary))',
              boxShadow: '0 4px 12px -2px hsl(var(--primary) / 0.1)',
            },
            iconTheme: {
              primary: 'hsl(var(--primary))',
              secondary: 'hsl(var(--background))',
            },
          },
          
          // Error toasts
          error: {
            duration: 5000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--destructive))',
              boxShadow: '0 4px 12px -2px hsl(var(--destructive) / 0.1)',
            },
            iconTheme: {
              primary: 'hsl(var(--destructive))',
              secondary: 'hsl(var(--background))',
            },
          },
          
          // Loading toasts
          loading: {
            duration: Infinity,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--muted-foreground))',
            },
            iconTheme: {
              primary: 'hsl(var(--muted-foreground))',
              secondary: 'hsl(var(--background))',
            },
          },
        }}
      />
    </>
  );
};