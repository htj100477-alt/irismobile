'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Check, ArrowRight, ArrowLeft, Landmark, Truck, CheckCircle2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/sell.module.css';

const PROVINCES = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원특별자치도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
];

const CITIES_BY_PROVINCE: Record<string, string[]> = {
  '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '경기도': ['수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시', '남양주시', '화성시', '평택시', '의정부시', '파주시', '시흥시', '김포시', '광명시', '광주시', '군포시', '오산시', '이천시', '양주시', '안성시', '구리시', '포천시', '의왕시', '하남시', '여주시', '동두천시', '양평군', '가평군', '연천군'],
  '부산광역시': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
  '인천광역시': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
  '대구광역시': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'],
  '광주광역시': ['동구', '서구', '남구', '북구', '광산구'],
  '대전광역시': ['동구', '중구', '서구', '유성구', '대덕구'],
  '울산광역시': ['중구', '남구', '동구', '북구', '울주군'],
  '세종특별자치시': ['세종시'],
  '강원특별자치도': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
  '충청북도': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
  '충청남도': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
  '전라북도': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
  '전라남도': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
  '경상북도': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
  '경상남도': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
  '제주특별자치도': ['제주시', '서귀포시']
};

const STORAGES = ['128GB', '256GB', '512GB'];
const COLORS = ['블랙/그레이', '화이트/실버', '블루/골드', '기타 색상'];

function SellFlowContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);

  // 시세 조회 상태
  const [brand, setBrand] = useState<'Apple' | 'Samsung' | null>(null);
  const [model, setModel] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [storage, setStorage] = useState<string>('256GB');
  const [color, setColor] = useState<string>('블랙/그레이');

  // 동적 시세 설정 데이터
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [loadingPrices, setLoadingPrices] = useState<boolean>(true);

  // Fetch prices on mount
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/trade-in-prices');
        const data = await res.json();
        if (data.success) {
          setPricingRules(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch trade-in prices:', err);
      } finally {
        setLoadingPrices(false);
      }
    }
    fetchPrices();
  }, []);

  const activeRule = pricingRules.find(r => r.model_name === model) || null;

  // 자가진단 항목 상태
  const [screen, setScreen] = useState<'clean' | 'scratch' | 'broken'>('clean');
  const [body, setBody] = useState<'clean' | 'scratch' | 'broken'>('clean');
  const [hasCameraError, setHasCameraError] = useState(false);
  const [hasScreenBurn, setHasScreenBurn] = useState(false);

  // 견적 결과 가격
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // 배송 및 정산 폼 상태
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'parcel'>('pickup');
  const [shippingAddress, setShippingAddress] = useState('');
  const [bankName, setBankName] = useState('국민은행');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // 시/도 및 시/군/구 선택 상태
  const [province, setProvince] = useState('서울특별시');
  const [city, setCity] = useState('강남구');
  const [detailedAddress, setDetailedAddress] = useState('');

  // 시/도 변경 핸들러
  const handleProvinceChange = (val: string) => {
    setProvince(val);
    const cities = CITIES_BY_PROVINCE[val] || [];
    setCity(cities[0] || '');
  };

  // 주소 조합 자동 연동
  useEffect(() => {
    setShippingAddress(`${province} ${city} ${detailedAddress}`.trim());
  }, [province, city, detailedAddress]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 로그인 상태 확인 및 세션 복원
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // 세션 임시 저장된 매입 데이터 복원
    const pendingData = sessionStorage.getItem('pending_trade_in');
    if (pendingData) {
      try {
        const parsed = JSON.parse(pendingData);
        setBrand(parsed.brand);
        setModel(parsed.model);
        setBasePrice(parsed.basePrice);
        setStorage(parsed.storage);
        setColor(parsed.color);
        setScreen(parsed.screen);
        setBody(parsed.body);
        setHasCameraError(parsed.hasCameraError);
        setHasScreenBurn(parsed.hasScreenBurn);
        setStep(5); // 견적 화면으로 직행
        
        sessionStorage.removeItem('pending_trade_in');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 동적 견적 가격 계산
  useEffect(() => {
    if (!model) return;

    let price = basePrice;
    
    if (activeRule) {
      price = activeRule.base_price;
      
      // 1. 용량에 따른 증감
      if (storage === '128GB') price -= activeRule.storage_128g_deduct;
      if (storage === '512GB') price += activeRule.storage_512g_add;

      // 2. 액정 상태 차감
      if (screen === 'scratch') price -= activeRule.screen_scratch_deduct;
      if (screen === 'broken') price -= activeRule.screen_broken_deduct;

      // 3. 테두리 외관 상태 차감
      if (body === 'scratch') price -= activeRule.body_scratch_deduct;
      if (body === 'broken') price -= activeRule.body_broken_deduct;

      // 4. 기능 불량 차감
      if (hasCameraError) price -= activeRule.camera_error_deduct;
      if (hasScreenBurn) price -= activeRule.screen_burn_deduct;
    } else {
      // 로딩 전이나 폴백용 하드코딩 수치
      if (storage === '128GB') price -= 80000;
      if (storage === '512GB') price += 120000;
      if (screen === 'scratch') price -= 70000;
      if (screen === 'broken') price -= 250000;
      if (body === 'scratch') price -= 40000;
      if (body === 'broken') price -= 120000;
      if (hasCameraError) price -= 100000;
      if (hasScreenBurn) price -= 80000;
    }

    // 최소 매입 보장가
    setEstimatedPrice(Math.max(price, 30000));
  }, [model, basePrice, storage, screen, body, hasCameraError, hasScreenBurn, activeRule]);

  // 브랜드 선택 핸들러
  const handleBrandSelect = (selected: 'Apple' | 'Samsung') => {
    setBrand(selected);
    setModel('');
    setStep(2);
  };

  // 모델 선택 핸들러
  const handleModelSelect = (selectedModel: string, base: number) => {
    setModel(selectedModel);
    setBasePrice(base);
    setStep(3);
  };

  // 비로그인 상태일 때, 자가진단 후 로그인하러 가기
  const handleLoginRequired = () => {
    const stateToSave = {
      brand,
      model,
      basePrice,
      storage,
      color,
      screen,
      body,
      hasCameraError,
      hasScreenBurn
    };
    sessionStorage.setItem('pending_trade_in', JSON.stringify(stateToSave));
    router.push('/auth?redirect=/sell');
  };

  // 매입 접수 요청 제출
  const handleSubmitTradeIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!shippingAddress.trim() || !bankAccount.trim() || !accountHolder.trim()) {
      setError('정산 계좌 및 수거 주소를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    const conditionAnswers = {
      screen,
      body,
      camera: hasCameraError ? 'bad' : 'good',
      screen_burn: hasScreenBurn ? 'bad' : 'none'
    };

    try {
      const res = await fetch('/api/trade-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: user.id,
          brand,
          model_name: model,
          storage,
          color,
          condition_answers: conditionAnswers,
          estimated_price: estimatedPrice,
          shipping_method: shippingMethod,
          shipping_address: shippingAddress,
          bank_name: bankName,
          bank_account: bankAccount,
          account_holder: accountHolder
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStep(6); // 신청 완료 완료화면 이동
      } else {
        setError(data.error || '매입 신청 도중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.sellWrapper}>
      
      {/* 진행바 (완료화면 step 6 제외) */}
      {step < 6 && (
        <div className={styles.stepHeader}>
          <div className={styles.stepProgress}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${(step / 5) * 100}%` }} 
            />
          </div>
          <div className={styles.stepInfo}>
            <span>단계 {step} / 5</span>
            <span>{step === 5 ? '견적 및 신청' : '정보 입력'}</span>
          </div>
        </div>
      )}

      {/* Step 1: 제조사 선택 */}
      {step === 1 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>판매하실 휴대폰의<br />제조사를 골라주세요</h2>
          <div className={styles.gridOptions}>
            <div 
              className={`${styles.brandCard} ${brand === 'Apple' ? styles.brandCardActive : ''}`}
              onClick={() => handleBrandSelect('Apple')}
            >
              <span className={styles.brandLogo} style={{ color: '#fff' }}></span>
              <span className={styles.brandName}>애플 (Apple)</span>
            </div>
            <div 
              className={`${styles.brandCard} ${brand === 'Samsung' ? styles.brandCardActive : ''}`}
              onClick={() => handleBrandSelect('Samsung')}
            >
              <span className={styles.brandLogo} style={{ color: '#034ea2' }}>SAMSUNG</span>
              <span className={styles.brandName}>삼성 (Samsung)</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: 모델명 선택 */}
      {step === 2 && brand && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>기종 모델명을<br />선택해주세요</h2>
          {loadingPrices ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              모델 정보를 불러오는 중입니다...
            </div>
          ) : (
            <div className={styles.listOptions}>
              {pricingRules
                .filter(item => item.brand.toLowerCase() === brand.toLowerCase())
                .map((item) => (
                  <div 
                    key={item.id || item.model_name} 
                    className={`${styles.modelItem} ${model === item.model_name ? styles.modelItemActive : ''}`}
                    onClick={() => handleModelSelect(item.model_name, item.base_price)}
                  >
                    <span>{item.model_name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>선택</span>
                  </div>
                ))}
              {pricingRules.filter(item => item.brand.toLowerCase() === brand.toLowerCase()).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  등록된 모델이 없습니다.
                </div>
              )}
            </div>
          )}
          <div className={styles.btnArea}>
            <button className={styles.btnBack} onClick={() => setStep(1)}>이전</button>
          </div>
        </div>
      )}

      {/* Step 3: 세부 스펙 (용량 & 색상) */}
      {step === 3 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>용량과 색상을<br />입력해주세요</h2>
          
          <div style={{ marginTop: '16px' }}>
            <h3 className={styles.formLabel} style={{ marginBottom: '8px' }}>저장 용량</h3>
            <div className={styles.chipGroup}>
              {STORAGES.map((s) => (
                <div 
                  key={s} 
                  className={`${styles.chipItem} ${storage === s ? styles.chipItemActive : ''}`}
                  onClick={() => setStorage(s)}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 className={styles.formLabel} style={{ marginBottom: '8px' }}>기기 색상</h3>
            <div className={styles.chipGroup}>
              {COLORS.map((c) => (
                <div 
                  key={c} 
                  className={`${styles.chipItem} ${color === c ? styles.chipItemActive : ''}`}
                  onClick={() => setColor(c)}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.btnArea}>
            <button className={styles.btnBack} onClick={() => setStep(2)}>이전</button>
            <button className={styles.btnNext} onClick={() => setStep(4)}>상태 진단으로 이동</button>
          </div>
        </div>
      )}

      {/* Step 4: 자가진단 (화면, 외관, 기능) */}
      {step === 4 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>현재 폰의 상태를<br />진단해주세요</h2>
          
          <div style={{ marginTop: '12px' }}>
            {/* 액정 상태 */}
            <div className={styles.questionCard}>
              <h3 className={styles.questionText}>1. 전면 액정 유리의 상태는 어떤가요?</h3>
              <div className={styles.conditionGrid}>
                <button 
                  type="button" 
                  className={`${styles.conditionBtn} ${screen === 'clean' ? styles.conditionBtnActive : ''}`}
                  onClick={() => setScreen('clean')}
                >
                  깨끗함
                </button>
                <button 
                  type="button" 
                  className={`${styles.conditionBtn} ${screen === 'scratch' ? styles.conditionBtnActive : ''}`}
                  onClick={() => setScreen('scratch')}
                >
                  미세 흠집 {activeRule ? `(-${(activeRule.screen_scratch_deduct / 10000).toLocaleString()}만)` : '(-7만)'}
                </button>
                <button 
                  type="button" 
                  className={`${styles.conditionBtn} ${screen === 'broken' ? styles.conditionBtnActive : ''}`}
                  onClick={() => setScreen('broken')}
                >
                  파손/깨짐 {activeRule ? `(-${(activeRule.screen_broken_deduct / 10000).toLocaleString()}만)` : '(-25만)'}
                </button>
              </div>
            </div>

            {/* 테두리 상태 */}
            <div className={styles.questionCard}>
              <h3 className={styles.questionText}>2. 측면 테두리 및 뒤판의 유리는 어떤가요?</h3>
              <div className={styles.conditionGrid}>
                <button 
                  type="button" 
                  className={`${styles.conditionBtn} ${body === 'clean' ? styles.conditionBtnActive : ''}`}
                  onClick={() => setBody('clean')}
                >
                  흠집없음
                </button>
                <button 
                  type="button" 
                  className={`${styles.conditionBtn} ${body === 'scratch' ? styles.conditionBtnActive : ''}`}
                  onClick={() => setBody('scratch')}
                >
                  미세 찍힘 {activeRule ? `(-${(activeRule.body_scratch_deduct / 10000).toLocaleString()}만)` : '(-4만)'}
                </button>
                <button 
                  type="button" 
                  className={`${styles.conditionBtn} ${body === 'broken' ? styles.conditionBtnActive : ''}`}
                  onClick={() => setBody('broken')}
                >
                  심한 파손 {activeRule ? `(-${(activeRule.body_broken_deduct / 10000).toLocaleString()}만)` : '(-12만)'}
                </button>
              </div>
            </div>

            {/* 기능 하자 */}
            <div className={styles.questionCard}>
              <h3 className={styles.questionText}>3. 불량 또는 고장이 있는 기능이 있나요?</h3>
              <div className={styles.checkboxList}>
                <div 
                  className={`${styles.checkboxItem} ${hasCameraError ? styles.checkboxItemActive : ''}`}
                  onClick={() => setHasCameraError(!hasCameraError)}
                >
                  <div className={styles.checkboxBox}>
                    {hasCameraError && <Check size={12} />}
                  </div>
                  <span>카메라 작동 고장 / 렌즈 손상 {activeRule ? `(-${(activeRule.camera_error_deduct / 10000).toLocaleString()}만)` : '(-10만)'}</span>
                </div>

                <div 
                  className={`${styles.checkboxItem} ${hasScreenBurn ? styles.checkboxItemActive : ''}`}
                  onClick={() => setHasScreenBurn(!hasScreenBurn)}
                >
                  <div className={styles.checkboxBox}>
                    {hasScreenBurn && <Check size={12} />}
                  </div>
                  <span>화면 잔상(Burn-in) / 백화 현상 {activeRule ? `(-${(activeRule.screen_burn_deduct / 10000).toLocaleString()}만)` : '(-8만)'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.btnArea}>
            <button className={styles.btnBack} onClick={() => setStep(3)}>이전</button>
            <button className={styles.btnNext} onClick={() => setStep(5)}>내 견적서 확인</button>
          </div>
        </div>
      )}

      {/* Step 5: 견적서 제시 및 접수 양식 */}
      {step === 5 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>산출된 예상 매입가를<br />확인하세요</h2>
          
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.priceEstimateCard}>
              <span className={styles.priceLabel}>{model} ({storage}) 자가진단 예상가</span>
              <span className={styles.priceNumber}>{estimatedPrice.toLocaleString()}원</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* 실물 검수 후 최종 매입 금액이 변동될 수 있습니다.</span>
            </div>

            {!user ? (
              // 로그인 안 된 사용자
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
                  매입 신청을 완료하기 위해서는<br />휴대폰 본인 인증(로그인)이 필요합니다.
                </p>
                <button 
                  onClick={handleLoginRequired} 
                  className={styles.btnNext}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  인증하고 신청 계속하기 <ArrowRight size={18} />
                </button>
                <button className={styles.btnBack} onClick={() => setStep(4)} style={{ width: '100%' }}>이전 단계로</button>
              </div>
            ) : (
              // 로그인 된 사용자 -> 배송/정산 양식 노출
              <form onSubmit={handleSubmitTradeIn} className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>1. 수거 방식 선택</label>
                  <div className={styles.radioGrid}>
                    <div 
                      className={`${styles.radioItem} ${shippingMethod === 'pickup' ? styles.radioItemActive : ''}`}
                      onClick={() => setShippingMethod('pickup')}
                    >
                      <Truck size={16} style={{ display: 'block', margin: '0 auto 6px' }} />
                      방문수거 (무료 우체국)
                    </div>
                    <div 
                      className={`${styles.radioItem} ${shippingMethod === 'parcel' ? styles.radioItemActive : ''}`}
                      onClick={() => setShippingMethod('parcel')}
                    >
                      <Landmark size={16} style={{ display: 'block', margin: '0 auto 6px' }} />
                      자택 편의점 택배발송
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>2. 수거/발송지 주소</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <select 
                      className={styles.formInput}
                      value={province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      aria-label="시/도 선택"
                    >
                      {PROVINCES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <select 
                      className={styles.formInput}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      aria-label="구/군/시 선택"
                    >
                      {(CITIES_BY_PROVINCE[province] || []).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="상세 주소를 입력하세요"
                    className={styles.formInput}
                    value={detailedAddress}
                    onChange={(e) => setDetailedAddress(e.target.value)}
                    required
                    aria-label="상세 주소"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>3. 정산받을 계좌 정보</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '8px' }}>
                    <select 
                      className={styles.formInput} 
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      aria-label="은행 선택"
                    >
                      <option>국민은행</option>
                      <option>신한은행</option>
                      <option>우리은행</option>
                      <option>하나은행</option>
                      <option>카카오뱅크</option>
                      <option>토스뱅크</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="계좌번호 입력 (- 제외)" 
                      className={styles.formInput}
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      required
                      aria-label="계좌번호"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="예금주 성명" 
                    className={styles.formInput}
                    style={{ marginTop: '8px' }}
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    required
                    aria-label="예금주"
                  />
                </div>

                {error && <p className={styles.errorText}>{error}</p>}

                <div className={styles.btnArea}>
                  <button type="button" className={styles.btnBack} onClick={() => setStep(4)}>이전</button>
                  <button type="submit" className={styles.btnNext} disabled={loading}>
                    {loading ? '신청 처리 중...' : '최종 매입 신청하기'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Step 6: 신청 완료 화면 */}
      {step === 6 && (
        <div className={`${styles.successWrapper} animate-slide-up`}>
          <CheckCircle2 size={68} color="var(--success-color)" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))' }} />
          <h2 className={styles.successTitle}>매입 신청이<br />성공적으로 접수되었습니다!</h2>
          <p className={styles.successDesc}>
            접수하신 수거지로 전담 택배 기사님이 배정되어 수일 내 방문합니다.<br />
            실물 기기 검수 후, 최종 확정 견적이 발행되면 문자 알림 및 마이페이지로 최종 확인 요청을 드립니다.
          </p>
          <button 
            onClick={() => router.push('/mypage')} 
            className={styles.btnNext}
            style={{ width: '80%' }}
          >
            내 거래 내역 확인하기
          </button>
          <button 
            onClick={() => router.push('/')} 
            className={styles.btnBack}
            style={{ width: '80%' }}
          >
            홈으로 이동
          </button>
        </div>
      )}

    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={<MobileLayout><div>로딩 중...</div></MobileLayout>}>
      <SellFlowContent />
    </Suspense>
  );
}
