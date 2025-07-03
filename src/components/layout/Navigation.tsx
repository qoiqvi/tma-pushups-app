'use client';

import { FC } from 'react';
import { usePathname } from 'next/navigation';
import { Home, Activity, BarChart3, Settings } from 'lucide-react';
import { Link } from '@/components/Link/Link';
import { classNames } from '@/css/classnames';
import { haptics } from '@/utils/haptics';

interface NavItem {
  href: string;
  icon: FC<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  {
    href: '/',
    icon: Home,
    label: 'Home'
  },
  {
    href: '/workout',
    icon: Activity,
    label: 'Workout'
  },
  {
    href: '/stats',
    icon: BarChart3,
    label: 'Stats'
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Settings'
  }
];

export const Navigation: FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4 pb-safe">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              href={href}
              onClick={() => haptics.navigationChange()}
              className={classNames(
                'flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 text-xs transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={classNames(
                'h-5 w-5 mb-1',
                isActive ? 'text-primary' : 'text-current'
              )} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};