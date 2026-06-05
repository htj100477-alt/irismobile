'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Smartphone, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/auth.module.css';

type AuthStep = 'phone' | 'login_pin' | 'register_name' | 'register_pin' | 'register_pin_confirm';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/mypage';

  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 휴대폰 번호 입력 시 자동 포맷팅 (010-XXXX-XXXX)
  const formatPhoneNumber = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length <= 3) return cleanValue;
    if (cleanValue.length <= 7) return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
    return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3, 7)}-${cleanValue.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setPhone(formatPhoneNumber(e.target.value));
  };

  // 휴대폰 번호 존재 여부 확인
  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_phone', phone_number: cleanPhone }),
      });
      const data = await res.json();

      if (data.exists) {
        setStep('login_pin');
        setName(data.name);
      } else {
        setStep('register_name');
      }
    } catch (err) {
      setError('서버 연결 실패. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 단계 1 (이름 입력 완료)
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    setError('');
    setStep('register_pin');
  };

  // 키패드 입력 핸들러 (PIN 코드 입력용)
  const handleKeypadPress = (val: string) => {
    setError('');
    const currentPin = step === 'register_pin_confirm' ? pinConfirm : pin;
    
    if (val === 'back') {
      if (step === 'register_pin_confirm') {
        setPinConfirm(prev => prev.slice(0, -1));
      } else {
        setPin(prev => prev.slice(0, -1));
      }
      return;
    }

    if (currentPin.length >= 4) return;

    const nextPin = currentPin + val;
    
    if (step === 'register_pin_confirm') {
      setPinConfirm(nextPin);
    } else {
      setPin(nextPin);
    }
  };

  // PIN 입력 감시 및 자동 서브밋
  useEffect(() => {
    if (step === 'login_pin' && pin.length === 4) {
      handleLogin();
    } else if (step === 'register_pin' && pin.length === 4) {
      // 1초 지연 후 다음 단계로 넘어가 조작감이 자연스럽게 만듦
      const timer = setTimeout(() => {
        setStep('register_pin_confirm');
      }, 300);
      return () => clearTimeout(timer);
    } else if (step === 'register_pin_confirm' && pinConfirm.length === 4) {
      if (pin !== pinConfirm) {
        setError('PIN 번호가 일치하지 않습니다. 다시 입력해주세요.');
        setPinConfirm('');
      } else {
        handleRegister();
      }
    }
  }, [pin, pinConfirm, step]);

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
        router.push(redirectPath);
      } else {
        setError(data.error || '로그인 실패. PIN 번호를 확인해주세요.');
        setPin('');
      }
    } catch (err) {
      setError('서버 연결 실패. 다시 시도해주세요.');
      setPin('');
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
        router.push(redirectPath);
      } else {
        setError(data.error || '회원가입 중 오류가 발생했습니다.');
        setPin('');
        setPinConfirm('');
        setStep('register_pin');
      }
    } catch (err) {
      setError('서버 연결 실패. 다시 시도해주세요.');
      setPin('');
      setPinConfirm('');
      setStep('register_pin');
    } finally {
      setLoading(false);
    }
  };

  // 키패드 렌더러
  const renderKeypad = () => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];
    return (
      <div className={styles.keypadGrid}>
        {keys.map((k, idx) => {
          if (k === '') return <div key={idx} className={styles.keypadKeyEmpty} />;
          return (
            <button 
              key={idx} 
              type="button"
              className={styles.keypadKey}
              onClick={() => handleKeypadPress(k)}
              disabled={loading}
            >
              {k === 'back' ? '←' : k}
            </button>
          );
        })}
      </div>
    );
  };

  // 가상 원형 PIN 인디케이터 렌더러
  const renderPinDots = (activeCount: number) => {
    return (
      <div className={styles.pinIndicatorWrapper}>
        {[0, 1, 2, 3].map((idx) => (
          <div 
            key={idx} 
            className={`${styles.pinDot} ${idx < activeCount ? styles.pinDotActive : ''}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <MobileLayout showBack={true}>
      <div className={styles.authWrapper}>
        
        {/* 1단계: 휴대폰 번호 입력 */}
        {step === 'phone' && (
          <form onSubmit={handleCheckPhone} className={`${styles.formSection} animate-fade-in`}>
            <div className={styles.titleSection}>
              <h2 className={styles.title}>휴대폰 번호로<br />간편하게 시작하세요</h2>
              <p className={styles.subtitle}>본인 명의의 휴대폰 번호로 가입/로그인합니다.</p>
            </div>

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
                />
              </div>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading || phone.length < 12}>
              {loading ? '확인 중...' : '다음'} <ArrowRight size={18} />
            </button>

            <div className={styles.infoBox}>
              💡 **테스트 가이드**:<br />
              원하시는 번호 아무거나 입력하여 즉시 가입/로그인 테스트할 수 있습니다.<br />
              (테스트 계정: `010-1234-5678` / PIN: `1234`가 기본 등록되어 있습니다.)
            </div>
          </form>
        )}

        {/* 회원가입 1단계: 이름 입력 */}
        {step === 'register_name' && (
          <form onSubmit={handleNameSubmit} className={`${styles.formSection} animate-fade-in`}>
            <div className={styles.titleSection}>
              <h2 className={styles.title}>신규 회원가입을 위한<br />이름을 입력해주세요</h2>
              <p className={styles.subtitle}>고객님과 거래 시 매칭할 실명을 작성해주세요.</p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="nameInput" className={styles.inputLabel}>이름 (실명)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                <input 
                  id="nameInput"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => { setError(''); setName(e.target.value); }}
                  className={styles.inputField}
                  style={{ paddingLeft: '48px', width: '100%' }}
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading || !name.trim()}>
              비밀번호(PIN) 설정으로 이동 <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* 기존 회원: 로그인 PIN 입력 */}
        {step === 'login_pin' && (
          <div className={`${styles.formSection} animate-fade-in`} style={{ flex: 1 }}>
            <div className={styles.titleSection}>
              <h2 className={styles.title}>{name}님,<br />PIN 비밀번호를 치세요</h2>
              <p className={styles.subtitle}>설정한 4자리 PIN 비밀번호를 입력해주세요.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Lock size={14} /> <span>보안 로그인 진행중</span>
            </div>

            {renderPinDots(pin.length)}

            {error && <p className={styles.errorText} style={{ textAlign: 'center' }}>{error}</p>}

            {renderKeypad()}
          </div>
        )}

        {/* 신규 회원: 회원가입 PIN 비밀번호 설정 */}
        {step === 'register_pin' && (
          <div className={`${styles.formSection} animate-fade-in`} style={{ flex: 1 }}>
            <div className={styles.titleSection}>
              <h2 className={styles.title}>사용할 4자리 PIN<br />비밀번호를 입력하세요</h2>
              <p className={styles.subtitle}>간편 로그인에 사용될 비밀번호입니다.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Lock size={14} /> <span>비밀번호 신규 생성</span>
            </div>

            {renderPinDots(pin.length)}

            {error && <p className={styles.errorText} style={{ textAlign: 'center' }}>{error}</p>}

            {renderKeypad()}
          </div>
        )}

        {/* 신규 회원: 회원가입 PIN 비밀번호 확인 */}
        {step === 'register_pin_confirm' && (
          <div className={`${styles.formSection} animate-fade-in`} style={{ flex: 1 }}>
            <div className={styles.titleSection}>
              <h2 className={styles.title}>설정한 비밀번호를<br />한번 더 쳐주세요</h2>
              <p className={styles.subtitle}>입력한 PIN 비밀번호와 일치해야 합니다.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--accent-light)' }} /> <span>비밀번호 검증</span>
            </div>

            {renderPinDots(pinConfirm.length)}

            {error && <p className={styles.errorText} style={{ textAlign: 'center' }}>{error}</p>}

            {renderKeypad()}
          </div>
        )}

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
