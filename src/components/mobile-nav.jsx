"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Settings, User, Image } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function MobileNav({ user }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const navItems = [
    { 
      name: 'Home', 
      href: '/dashboard', 
      icon: Home,
      active: pathname === '/dashboard' 
    },
    { 
      name: 'Tools', 
      href: '/dashboard/tools', 
      icon: Layers,
      active: pathname.includes('/dashboard/tools') 
    },
    { 
      name: 'Gallery', 
      href: '/dashboard/gallery', 
      icon: Image,
      active: pathname.includes('/dashboard/gallery') 
    },
    { 
      name: 'Profile', 
      href: '/dashboard/profile', 
      icon: User,
      active: pathname.includes('/dashboard/profile') 
    },
  ];

  return (
    <div className={`md:hidden fixed bottom-0 left-0 z-50 w-full h-16 border-t flex items-center justify-around px-2
      ${isDarkMode 
        ? 'bg-gray-900 border-gray-800 text-gray-300' 
        : 'bg-white border-gray-200 text-gray-700'}`}>
      {navItems.map((item) => (
        <Link 
          key={item.name}
          href={item.href}
          className={`flex flex-col items-center justify-center w-full h-full ${
            item.active 
              ? 'text-purple-600 dark:text-purple-400' 
              : isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <item.icon className={`h-6 w-6 ${
            item.active 
              ? 'text-purple-600 dark:text-purple-400' 
              : isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <span className="text-xs mt-1">{item.name}</span>
        </Link>
      ))}
    </div>
  );
} 