'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Explore' },
  { href: '/predictions', label: 'History' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1f1f1f]">
      <div className="container mx-auto px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo - simple, confident */}
          <Link href="/" className="text-xl font-semibold tracking-tight text-white">
            ModelHub
          </Link>

          {/* Navigation - minimal */}
          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive
                      ? 'text-white'
                      : 'text-[#a3a3a3] hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
