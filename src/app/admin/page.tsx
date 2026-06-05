'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div style={{ color: '#fff', textAlign: 'center', padding: '100px 0', fontSize: '14px' }}>
      관리자 대시보드로 이동 중...
    </div>
  );
}
