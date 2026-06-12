'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Smartphone, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/auth.module.css';

import { useRef } from 'react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/mypage';

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('고객');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);

  // 휴대폰 번호 입력 시 자동 포맷팅 (010-XXXX-XXXX)
  const formatPhoneNumber = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length <= 3) return cleanValue;
    if (cleanValue.length <= 7) return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
    return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3, 7)}-${cleanValue.slice(7, 11)}`;
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);

    const cleanPhone = formatted.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 11) {
      setCheckingPhone(true);
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_phone', phone_number: cleanPhone }),
        });
        const data = await res.json();

        if (data.exists) {
          setUserExists(true);
          setName(data.name || '고객');
        } else {
          setUserExists(false);
          setName('고객');
        }

        // 상태 업데이트 후 포커스 이동을 위해 지연 처리
        setTimeout(() => {
          pinInputRef.current?.focus();
        }, 100);
      } catch (err) {
        setError('서버 연결 실패. 다시 시도해주세요.');
      } finally {
        setCheckingPhone(false);
      }
    } else {
      setUserExists(null);
      setPin('');
      setPinConfirm('');
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPin(val);
  };

  const handlePinConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPinConfirm(val);
  };

  // PIN 입력 완료 감시
  useEffect(() => {
    if (pin.length === 4) {
      if (userExists === true) {
        handleLogin();
      } else if (userExists === false) {
        setTimeout(() => {
          confirmInputRef.current?.focus();
        }, 100);
      }
    }
  }, [pin, userExists]);

  useEffect(() => {
    if (pinConfirm.length === 4 && userExists === false) {
      if (pin !== pinConfirm) {
        setError('PIN 번호가 일치하지 않습니다. 다시 입력해주세요.');
        setPinConfirm('');
        setTimeout(() => {
          confirmInputRef.current?.focus();
        }, 50);
      } else {
        handleRegister();
      }
    }
  }, [pinConfirm, pin, userExists]);

  // 로그인 요청
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', phone_number: cleanPhone, pin_code: pin }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.member));
        
        // 권한에 따른 분기 라우팅
        const role = data.member.role;
        if (role === 'admin' || role === 'manager' || role === 'staff') {
          sessionStorage.setItem('admin_token', 'true');
          sessionStorage.setItem('admin_role', role);
          sessionStorage.setItem('admin_role_name', role === 'admin' ? '어드민' : role === 'manager' ? '매니저' : '스탭');
          router.push('/admin/dashboard');
        } else {
          router.push(redirectPath);
        }
      } else {
        setError(data.error || '로그인 실패. PIN 번호를 확인해주세요.');
        setPin('');
        setTimeout(() => {
          pinInputRef.current?.focus();
        }, 50);
      }
    } catch (err) {
      setError('서버 연결 실패. 다시 시도해주세요.');
      setPin('');
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 50);
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 요청
  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', phone_number: cleanPhone, pin_code: pin, name }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.member));
        
        // 권한에 따른 분기 라우팅
        const role = data.member.role;
        if (role === 'admin' || role === 'manager' || role === 'staff') {
          sessionStorage.setItem('admin_token', 'true');
          sessionStorage.setItem('admin_role', role);
          sessionStorage.setItem('admin_role_name', role === 'admin' ? '어드민' : role === 'manager' ? '매니저' : '스탭');
          router.push('/admin/dashboard');
        } else {
          router.push(redirectPath);
        }
      } else {
        setError(data.error || '회원가입 중 오류가 발생했습니다.');
        setPin('');
        setPinConfirm('');
        setTimeout(() => {
          pinInputRef.current?.focus();
        }, 50);
      }
    } catch (err) {
      setError('서버 연결 실패. 다시 시도해주세요.');
      setPin('');
      setPinConfirm('');
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout showBack={true}>
      <div className={styles.authWrapper}>
        <div className={`${styles.formSection} animate-fade-in`}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>
              {userExists === null && <>휴대폰 번호로<br />간편하게 시작하세요</>}
              {userExists === true && <>{name}님,<br />PIN 비밀번호를 입력하세요</>}
              {userExists === false && <>반갑습니다!<br />새로운 PIN 번호를 설정하세요</>}
            </h2>
            <p className={styles.subtitle}>
              {userExists === null && '본인 명의의 휴대폰 번호로 가입/로그인합니다.'}
              {userExists === true && '설정한 4자리 PIN 비밀번호를 입력해주세요.'}
              {userExists === false && '간편 로그인 및 거래 조회에 사용될 4자리 비밀번호입니다.'}
            </p>
          </div>

          {/* 1. 휴대폰 번호 입력 필드 */}
          <div className={styles.inputGroup}>
            <label htmlFor="phoneInput" className={styles.inputLabel}>휴대폰 번호</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Smartphone size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
              <input 
                id="phoneInput"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={handlePhoneChange}
                className={styles.inputField}
                style={{ paddingLeft: '48px', width: '100%' }}
                maxLength={13}
                required
                autoFocus
                disabled={loading || checkingPhone}
              />
            </div>
          </div>

          {checkingPhone && (
            <p style={{ color: 'var(--accent-light)', fontSize: '12px', marginTop: '4px' }}>가입 상태 조회 중...</p>
          )}

          {/* 2. PIN 비밀번호 입력 필드 (가입 상태 판별 완료 시 노출) */}
          {userExists !== null && (
            <div className={`${styles.inputGroup} animate-slide-up`} style={{ marginTop: '16px' }}>
              <label htmlFor="pinInput" className={styles.inputLabel}>
                {userExists === true ? 'PIN 비밀번호 (4자리)' : '신규 비밀번호 PIN (4자리)'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                <input 
                  id="pinInput"
                  ref={pinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="숫자 4자리"
                  value={pin}
                  onChange={handlePinChange}
                  className={styles.inputField}
                  style={{ paddingLeft: '48px', width: '100%', letterSpacing: '4px' }}
                  maxLength={4}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* 3. 신규 가입 시 PIN 확인 필드 (1차 PIN 4자리 입력 시 노출) */}
          {userExists === false && pin.length === 4 && (
            <div className={`${styles.inputGroup} animate-slide-up`} style={{ marginTop: '16px' }}>
              <label htmlFor="confirmInput" className={styles.inputLabel}>비밀번호 확인</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                <input 
                  id="confirmInput"
                  ref={confirmInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="한번 더 입력"
                  value={pinConfirm}
                  onChange={handlePinConfirmChange}
                  className={styles.inputField}
                  style={{ paddingLeft: '48px', width: '100%', letterSpacing: '4px' }}
                  maxLength={4}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {error && <p className={styles.errorText} style={{ marginTop: '12px' }}>{error}</p>}
          {loading && <p style={{ color: 'var(--accent-light)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>로그인 및 가입을 진행 중입니다...</p>}

          <div className={styles.infoBox} style={{ marginTop: '24px' }}>
            💡 **테스트 가이드**:<br />
            원하시는 번호 아무거나 입력하여 즉시 가입/로그인 테스트할 수 있습니다.<br />
            (테스트 계정: `010-1234-5678` / PIN: `1234`가 기본 등록되어 있습니다.)
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <MobileLayout title="로그인 / 가입" showBack={true}>
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>로딩 중...</div>
      </MobileLayout>
    }>
      <AuthContent />
    </Suspense>
  );
}

