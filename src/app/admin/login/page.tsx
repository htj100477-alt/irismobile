'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth?redirect=/admin/dashboard');
  }, [router]);

  return (
    <div style={{ color: '#fff', textAlign: 'center', padding: '100px 0', fontSize: '14px' }}>
      인증 페이지로 이동 중...
    </div>
  );
}
