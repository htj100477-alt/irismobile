'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Check, ArrowRight, ArrowLeft, Landmark, Truck, CheckCircle2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/sell.module.css';

// 기기 리스트 정보 정의
const MODELS_BY_BRAND: Record<string, Array<{ name: string; basePrice: number }>> = {
  Apple: [
    { name: '아이폰 15 프로', basePrice: 1150000 },
    { name: '아이폰 15', basePrice: 750000 },
    { name: '아이폰 14 프로', basePrice: 850000 },
    { name: '아이폰 13 프로', basePrice: 580000 },
    { name: '아이폰 13', basePrice: 420000 },
  ],
  Samsung: [
    { name: '갤럭시 S24 울트라', basePrice: 1200000 },
    { name: '갤럭시 S24', basePrice: 720000 },
    { name: '갤럭시 S23 울트라', basePrice: 780000 },
    { name: '갤럭시 Z 플립 5', basePrice: 620000 },
  ],
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

    // 1. 용량에 따른 증감
    if (storage === '128GB') price -= 80000;
    if (storage === '512GB') price += 120000;

    // 2. 액정 상태 차감
    if (screen === 'scratch') price -= 70000;
    if (screen === 'broken') price -= 250000;

    // 3. 테두리 외관 상태 차감
    if (body === 'scratch') price -= 40000;
    if (body === 'broken') price -= 120000;

    // 4. 기능 불량 차감
    if (hasCameraError) price -= 100000;
    if (hasScreenBurn) price -= 80000;

    // 최소 매입 보장가
    setEstimatedPrice(Math.max(price, 30000));
  }, [model, basePrice, storage, screen, body, hasCameraError, hasScreenBurn]);

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
          <div className={styles.listOptions}>
            {MODELS_BY_BRAND[brand].map((item) => (
              <div 
                key={item.name} 
                className={`${styles.modelItem} ${model === item.name ? styles.modelItemActive : ''}`}
                onClick={() => handleModelSelect(item.name, item.basePrice)}
              >
                <span>{item.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>선택</span>
              </div>
            ))}
          </div>
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
                  미세 흠집
                </button>
                <button 
                  type="button" 
                  className={`${styles.conditionBtn} ${screen === 'broken' ? styles.conditionBtnActive : ''}`}
                  onClick={() => setScreen('broken')}
                >
                  파손/깨짐 (-25만)
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
                  미세 찍힘
                </button>
                <button 
                  type="button" 
                  className={`${styles.conditionBtn} ${body === 'broken' ? styles.conditionBtnActive : ''}`}
                  onClick={() => setBody('broken')}
                >
                  심한 파손 (-12만)
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
                  <span>카메라 작동 고장 / 렌즈 손상 (-10만)</span>
                </div>

                <div 
                  className={`${styles.checkboxItem} ${hasScreenBurn ? styles.checkboxItemActive : ''}`}
                  onClick={() => setHasScreenBurn(!hasScreenBurn)}
                >
                  <div className={styles.checkboxBox}>
                    {hasScreenBurn && <Check size={12} />}
                  </div>
                  <span>화면 잔상(Burn-in) / 백화 현상 (-8만)</span>
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
                  <label htmlFor="addressInput" className={styles.formLabel}>2. 수거/발송지 주소</label>
                  <input 
                    id="addressInput"
                    type="text" 
                    placeholder="지번/도로명 주소 및 상세 주소"
                    className={styles.formInput}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    required
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
