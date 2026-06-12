'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn } from 'lucide-react';
import styles from '@/styles/admin.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    let role = '';
    let roleName = '';

    if (password === 'admin1234') {
      role = 'admin';
      roleName = '어드민';
    } else if (password === 'manager1234') {
      role = 'manager';
      roleName = '매니저';
    } else if (password === 'staff1234') {
      role = 'staff';
      roleName = '스탭';
    } else if (password === 'user1234') {
      role = 'general';
      roleName = '일반';
    }

    if (role) {
      sessionStorage.setItem('admin_token', 'true');
      sessionStorage.setItem('admin_role', role);
      sessionStorage.setItem('admin_role_name', roleName);
      router.push('/admin/dashboard');
    } else {
      setError('비밀번호가 일치하지 않습니다.');
      setPassword('');
    }
  };

  return (
    <div className={styles.adminLoginWrapper}>
      <div className={`${styles.loginCard} animate-slide-up`}>
        <div className={styles.loginHeader}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: 'rgba(95, 93, 236, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-light)',
            margin: '0 auto 16px'
          }}>
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>트루 모바일 관리자</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>판매자 대시보드 권한 인증</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="adminPasswordInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>관리자 비밀번호</label>
            <input 
              id="adminPasswordInput"
              type="password"
              placeholder="마스터 암호를 입력하세요"
              value={password}
              onChange={(e) => { setError(''); setPassword(e.target.value); }}
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '14px',
                color: '#fff',
                outline: 'none'
              }}
              required
              autoFocus
            />
          </div>

          {error && <p style={{ color: 'var(--danger-color)', fontSize: '12px', marginTop: '-4px' }}>{error}</p>}

          <button 
            type="submit" 
            style={{
              background: 'var(--accent-gradient)',
              color: '#fff',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px'
            }}
          >
            대시보드 진입 <LogIn size={16} />
          </button>
        </form>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'left',
          lineHeight: '1.6'
        }}>
          🔑 **테스트 로그인 비밀번호**:<br />
          - 어드민 권한: `admin1234`<br />
          - 매니저 권한: `manager1234`<br />
          - 스탭 권한: `staff1234`<br />
          - 일반 권한: `user1234`
        </div>
      </div>
    </div>
  );
}
