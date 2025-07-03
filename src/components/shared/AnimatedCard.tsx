'use client';

import { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  hover?: boolean;
  index?: number;
}

export const AnimatedCard: FC<AnimatedCardProps> = ({ 
  children, 
  delay = 0,
  hover = true,
  index = 0,
  ...props 
}) => {
  const cardVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    hover: hover ? {
      y: -4,
      scale: 1.02
    } : {},
    tap: {
      scale: 0.98
    }
  };

  const transition = {
    duration: 0.5,
    delay: delay + (index * 0.1)
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      transition={transition}
    >
      <Card {...props}>
        {children}
      </Card>
    </motion.div>
  );
};