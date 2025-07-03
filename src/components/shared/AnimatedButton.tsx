'use client';

import { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';

interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
  haptic?: boolean;
  pulseOnHover?: boolean;
}

export const AnimatedButton: FC<AnimatedButtonProps> = ({ 
  children, 
  haptic = true,
  pulseOnHover = false,
  onClick,
  ...props 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    // Haptic feedback if available and enabled
    if (haptic && typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    // Call original onClick
    if (onClick) {
      onClick(e);
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: pulseOnHover ? 1.05 : 1.02,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  return (
    <motion.div
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className="inline-block"
    >
      <Button {...props} onClick={handleClick}>
        {children}
      </Button>
    </motion.div>
  );
};