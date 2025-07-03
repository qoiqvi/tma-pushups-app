'use client';

import { FC, useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef } from 'react';

interface CountUpAnimationProps {
  end: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  triggerOnView?: boolean;
  formatter?: (value: number) => string;
}

export const CountUpAnimation: FC<CountUpAnimationProps> = ({
  end,
  start = 0,
  duration = 2,
  prefix = '',
  suffix = '',
  className = '',
  triggerOnView = true,
  formatter
}) => {
  const [count, setCount] = useState(start);
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!triggerOnView || inView) {
      let startTime: number;
      let animationFrame: number;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Easing function for smooth animation
        const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        const currentCount = Math.floor(start + (end - start) * easeOutExpo);
        setCount(currentCount);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      // Trigger scale animation
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.6, ease: "easeOut" }
      });

      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [inView, triggerOnView, start, end, duration, controls]);

  const formatValue = (value: number) => {
    if (formatter) {
      return formatter(value);
    }
    return value.toLocaleString();
  };

  return (
    <motion.span
      ref={ref}
      animate={controls}
      className={className}
    >
      {prefix}
      {formatValue(count)}
      {suffix}
    </motion.span>
  );
};