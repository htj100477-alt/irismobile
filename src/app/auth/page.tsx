'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Smartphone, Lock, User, ArrowRight } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/auth.module.css';

import { useRef } from 'react';

// 대한민국 행정구역 데이터 (도/시 및 시/군/구 매핑)
const KOREA_ADDRESS_DATA: Record<string, string[]> = {
  '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산광역시': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
  '대구광역시': ['군위군', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
  '인천광역시': ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'],
  '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
  '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
  '세종특별자치시': ['세종시'],
  '경기도': ['가평군', '고양시 덕양구', '고양시 일산동구', '고양시 일산서구', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시 분당구', '성남시 수정구', '성남시 중원구', '수원시 권선구', '수원시 영통구', '수원시 장안구', '수원시 팔달구', '시흥시', '안산시 단원구', '안산시 상록구', '안성시', '안양시 동안구', '안양시 만안구', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시 기흥구', '용인시 수지구', '용인시 처인구', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
  '강원특별자치도': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  '충청북도': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시 상당구', '청주시 서원구', '청주시 청원구', '청주시 흥덕구', '충주시'],
  '충청남도': ['계룡시', '공주시', '금산군', '논산시', '당진시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시 동남구', '천안시 서북구', '청양군', '태안군', '홍성군'],
  '전북특별자치도': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시 덕진구', '전주시 완산구', '정읍시', '진안군'],
  '전라남도': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
  '경상북도': ['경산시', '경주시', '고령군', '구미시', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시 남구', '포항시 북구'],
  '경상남도': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시 마산합포구', '창원시 마산회원구', '창원시 성산구', '창원시 의창구', '창원시 진해구', '통영시', '하동군', '함안군', '함양군', '합천군'],
  '제주특별자치도': ['서귀포시', '제주시']
};

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/mypage';

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 회원가입 추가정보(실명, 주소) 수집 단계 플래그
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

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
          setName('');
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
      setShowAdditionalInfo(false);
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
        // 비밀번호 확인 통과 시 추가 정보 입력 화면으로 전환
        setShowAdditionalInfo(true);
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
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!selectedProvince) {
      setError('행정구역(도/시)을 선택해주세요.');
      return;
    }
    if (!selectedCity) {
      setError('도시(시/군/구)를 선택해주세요.');
      return;
    }
    if (!detailAddress.trim()) {
      setError('상세 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'register', 
          phone_number: cleanPhone, 
          pin_code: pin, 
          name: name.trim(),
          address_province: selectedProvince,
          address_city: selectedCity,
          address_detail: detailAddress.trim()
        }),
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
      }
    } catch (err) {
      setError('서버 연결 실패. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 추가 정보를 받는 양식 뷰 렌더링
  if (showAdditionalInfo) {
    return (
      <MobileLayout showBack={true} onBack={() => setShowAdditionalInfo(false)}>
        <div className={styles.authWrapper}>
          <div className={`${styles.formSection} animate-fade-in`}>
            <div className={styles.titleSection}>
              <h2 className={styles.title}>
                추가 정보를<br />입력해 주세요
              </h2>
              <p className={styles.subtitle}>
                고객 및 주문 배송 관리를 위한 실명과 주소를 등록합니다.
              </p>
            </div>

            {/* 이름 입력 */}
            <div className={styles.inputGroup}>
              <label htmlFor="nameInput" className={styles.inputLabel}>이름</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                <input 
                  id="nameInput"
                  type="text"
                  placeholder="실명을 입력해주세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.inputField}
                  style={{ paddingLeft: '48px', width: '100%' }}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {/* 주소 (도/시) 선택 */}
            <div className={styles.inputGroup}>
              <label htmlFor="provinceSelect" className={styles.inputLabel}>주소 (도/시)</label>
              <select
                id="provinceSelect"
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedCity(''); // 상위 지역 변경 시 도시 초기화
                }}
                className={styles.inputField}
                style={{ width: '100%', cursor: 'pointer', appearance: 'auto', paddingRight: '20px' }}
                disabled={loading}
              >
                <option value="">도/시 선택</option>
                {Object.keys(KOREA_ADDRESS_DATA).map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            {/* 주소 (시/군/구) 선택 */}
            <div className={styles.inputGroup}>
              <label htmlFor="citySelect" className={styles.inputLabel}>주소 (시/군/구)</label>
              <select
                id="citySelect"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className={styles.inputField}
                style={{ width: '100%', cursor: 'pointer', appearance: 'auto', paddingRight: '20px' }}
                disabled={loading || !selectedProvince}
              >
                <option value="">시/군/구 선택</option>
                {selectedProvince && KOREA_ADDRESS_DATA[selectedProvince]?.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* 상세 주소 입력 */}
            <div className={styles.inputGroup}>
              <label htmlFor="detailAddressInput" className={styles.inputLabel}>상세 주소 (도로명 및 번지수/동호수)</label>
              <input 
                id="detailAddressInput"
                type="text"
                placeholder="예: 테헤란로 123, 101호"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                className={styles.inputField}
                style={{ width: '100%' }}
                required
                disabled={loading}
              />
            </div>

            {error && <p className={styles.errorText} style={{ marginTop: '12px' }}>{error}</p>}
            {loading && <p style={{ color: 'var(--accent-light)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>가입 진행 중...</p>}

            <button 
              onClick={handleRegister}
              className={styles.submitBtn}
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading || !name.trim() || !selectedProvince || !selectedCity || !detailAddress.trim()}
            >
              가입 완료 <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

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

