'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Smartphone, ShoppingBag, User } from 'lucide-react';
import styles from '@/styles/layout.module.css';

export default function BottomNav() {
  const pathname = usePathname();

  // 관리자 모드(/admin)인 경우 하단 모바일 내비게이션 바 숨김
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { label: '홈', path: '/', icon: Home },
    { label: '내폰팔기', path: '/sell', icon: Smartphone },
    { label: '폰사기', path: '/buy', icon: ShoppingBag },
    { label: '마이페이지', path: '/mypage', icon: User },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const Icon = item.icon;
        // Exact match or sub-path match (except for '/')
        const isActive = 
          item.path === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.path);

        return (
          <Link 
            key={item.path} 
            href={item.path} 
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <div className={styles.navIconWrapper}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
