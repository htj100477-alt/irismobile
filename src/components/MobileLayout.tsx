'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, Battery, Wifi, Signal } from 'lucide-react';
import styles from '@/styles/layout.module.css';
import BottomNav from './BottomNav';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function MobileLayout({ children, title, showBack }: MobileLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [time, setTime] = useState('09:41');

  // 실시간 가상 상태바 시간 계산
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  // 현재 경로에 따라 헤더 제목 자동 지정 (title 프롭이 없는 경우)
  const getHeaderTitle = () => {
    if (title) return title;
    if (pathname === '/') return 'TRUE MOBILE';
    if (pathname.startsWith('/sell')) return '내 폰 최고가 판매';
    if (pathname.startsWith('/buy')) return '안심 중고폰 상점';
    if (pathname.startsWith('/mypage')) return '마이페이지';
    if (pathname.startsWith('/auth')) return '로그인 / 가입';
    return '트루 모바일';
  };

  // 홈이 아니고 admin이 아닌 경우 기본 백버튼 활성화
  const shouldShowBack = showBack !== undefined ? showBack : (pathname !== '/' && !pathname.startsWith('/admin'));
  const isAdmin = pathname.startsWith('/admin');

  // 관리자(admin) 화면은 모바일 래퍼를 씌우지 않고 풀 스크린으로 렌더링
  if (isAdmin) {
    return <div className="admin-root" style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#090d16' }}>{children}</div>;
  }

  return (
    <div className={styles.desktopBackground}>
      <div className={styles.mobileContainer}>
        {/* 가상 폰 상태표시줄 */}
        <div className={styles.statusBar}>
          <div>{time}</div>
          <div className={styles.statusBarIcons}>
            <Signal size={12} fill="currentColor" strokeWidth={1} />
            <Wifi size={12} strokeWidth={2.5} />
            <Battery size={14} fill="currentColor" strokeWidth={1} />
          </div>
        </div>

        {/* 헤더 바 */}
        <header className={styles.header}>
          {shouldShowBack ? (
            <button onClick={() => router.back()} className={styles.backButton} aria-label="뒤로가기">
              <ChevronLeft size={24} />
            </button>
          ) : (
            <div className={styles.backButton} style={{ opacity: 0, pointerEvents: 'none' }} />
          )}

          <h1 className={styles.headerTitle}>{getHeaderTitle()}</h1>

          {/* 오른쪽 정렬용 목업 버튼 또는 관리자 바로가기 */}
          {pathname === '/' ? (
            <button 
              onClick={() => router.push('/admin')} 
              className={styles.headerAction} 
              title="관리자 모드"
              aria-label="관리자 모드 이동"
            >
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>ADMIN</span>
            </button>
          ) : (
            <div className={styles.headerAction} style={{ opacity: 0 }} />
          )}
        </header>

        {/* 콘텐츠 본문 */}
        <main className={styles.content}>
          {children}
        </main>

        {/* 하단 탭 바 */}
        <BottomNav />
      </div>
    </div>
  );
}
