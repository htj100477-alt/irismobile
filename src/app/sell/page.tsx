'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Landmark, Truck, CheckCircle2 } from 'lucide-react';
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

const BRAND_LOGOS: Record<string, string> = {
  apple: 'https://img.icons8.com/ios-filled/100/ffffff/mac-os.png',
  samsung: 'https://img.icons8.com/color/120/samsung.png',
  lg: 'https://img.icons8.com/color/120/lg.png',
  lenovo: 'https://img.icons8.com/color/120/lenovo.png',
  google: 'https://img.icons8.com/color/120/google-logo.png',
  기타: 'https://img.icons8.com/ios-filled/100/ffffff/smartphone.png'
};

function SellFlowContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);

  // 시세 조회 상태
  const [brand, setBrand] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [series, setSeries] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [grade, setGrade] = useState<'S' | 'A' | 'B' | null>(null);
  const [storage, setStorage] = useState<string>('256GB');
  const [color, setColor] = useState<string>('블랙/그레이');

  // 동적 시세 설정 데이터
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Fetch prices and categories on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const pricesRes = await fetch('/api/trade-in-prices');
        const pricesData = await pricesRes.json();
        if (pricesData.success) {
          setPricingRules(pricesData.data);
        }

        const catsRes = await fetch('/api/categories');
        const catsData = await catsRes.json();
        if (catsData.success) {
          setCategories(catsData.data);
        }
      } catch (err) {
        console.error('Failed to fetch sell page metadata:', err);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const activeRule = pricingRules.find(r => r.model_name === model) || null;

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
        setCategory(parsed.category);
        setSeries(parsed.series);
        setModel(parsed.model);
        setBasePrice(parsed.basePrice);
        setGrade(parsed.grade);
        setStorage(parsed.storage);
        setColor(parsed.color);
        setStep(7); // 견적 & 신청 화면으로 직행
        
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

      // 2. 등급(자가진단 대체)에 따른 차감
      if (grade === 'A') {
        price -= (activeRule.screen_scratch_deduct + activeRule.body_scratch_deduct);
      } else if (grade === 'B') {
        price -= (activeRule.screen_broken_deduct + activeRule.body_broken_deduct);
      }
    } else {
      // 로딩 전이나 폴백용 하드코딩 수치
      if (storage === '128GB') price -= 80000;
      if (storage === '512GB') price += 120000;
      if (grade === 'A') price -= 110000;
      if (grade === 'B') price -= 370000;
    }

    // 최소 매입 보장가
    setEstimatedPrice(Math.max(price, 30000));
  }, [model, basePrice, storage, grade, activeRule]);

  // 브랜드 선택 핸들러
  const handleBrandSelect = (selected: string) => {
    setBrand(selected);
    setCategory('');
    setSeries('');
    setModel('');
    setStep(2);
  };

  // 비로그인 상태일 때, 자가진단 후 로그인하러 가기
  const handleLoginRequired = () => {
    const stateToSave = {
      brand,
      category,
      series,
      model,
      basePrice,
      grade,
      storage,
      color
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

    // 등급을 바탕으로 호환성용 자가진단 항목 가공
    const conditionAnswers = {
      screen: grade === 'S' ? 'clean' : grade === 'A' ? 'scratch' : 'broken',
      body: grade === 'S' ? 'clean' : grade === 'A' ? 'scratch' : 'broken',
      camera: grade === 'B' ? 'bad' : 'good',
      screen_burn: grade === 'B' ? 'bad' : 'none',
      grade: grade // 등급 추가
    };

    try {
      const res = await fetch('/api/trade-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: user.id,
          brand,
          category,
          series,
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
        setStep(8); // 신청 완료 완료화면 이동 (전체 스텝 수 조절)
      } else {
        setError(data.error || '매입 신청 도중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 데이터 기준으로 동적 제조사 추출
  const availableBrands = Array.from(new Set(pricingRules.map(r => r.brand)));

  // 선택 브랜드가 매입 가능한 기종 카테고리
  const availableCategories = categories.filter(cat => 
    pricingRules.some(r => r.brand.toLowerCase() === brand.toLowerCase() && r.category === cat.name)
  );

  // 선택 브랜드 & 기종의 시리즈
  const availableSeries = Array.from(new Set(
    pricingRules
      .filter(r => r.brand.toLowerCase() === brand.toLowerCase() && r.category === category)
      .map(r => r.series)
  ));

  // 선택 브랜드 & 기종 & 시리즈의 세부 모델들
  const availableModels = pricingRules.filter(r => 
    r.brand.toLowerCase() === brand.toLowerCase() && 
    r.category === category && 
    r.series === series
  );

  return (
    <div className={styles.sellWrapper}>
      
      {/* 진행바 (완료화면 step 8 제외) */}
      {step < 8 && (
        <div className={styles.stepHeader}>
          <div className={styles.stepProgress}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${(step / 7) * 100}%` }} 
            />
          </div>
          <div className={styles.stepInfo}>
            <span>단계 {step} / 7</span>
            <span>
              {step === 1 && '제조사 선택'}
              {step === 2 && '기종 선택'}
              {step === 3 && '시리즈 선택'}
              {step === 4 && '모델 선택'}
              {step === 5 && '상태 등급 선택'}
              {step === 6 && '용량 및 색상'}
              {step === 7 && '최종 신청서'}
            </span>
          </div>
        </div>
      )}

      {/* Step 1: 제조사 선택 */}
      {step === 1 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>판매하실 기기의<br />제조사를 골라주세요</h2>
          {loadingData ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              시세 정보를 불러오는 중...
            </div>
          ) : (
            <div className={styles.gridOptions}>
              {availableBrands.map((b) => (
                <div 
                  key={b} 
                  className={`${styles.brandCard} ${brand === b ? styles.brandCardActive : ''}`}
                  onClick={() => handleBrandSelect(b)}
                >
                  <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={BRAND_LOGOS[b.toLowerCase()] || BRAND_LOGOS['기타']} 
                      alt={b} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <span className={styles.brandName}>{b}</span>
                </div>
              ))}
              {availableBrands.length === 0 && (
                <div style={{ gridColumn: 'span 2', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  등록된 매입 가격 정보가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: 기종 카테고리 선택 */}
      {step === 2 && brand && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>어떤 종류의 기기인가요?</h2>
          <div className={styles.gridOptions}>
            {availableCategories.map((cat) => (
              <div 
                key={cat.id} 
                className={`${styles.brandCard} ${category === cat.name ? styles.brandCardActive : ''}`}
                onClick={() => {
                  setCategory(cat.name);
                  setSeries('');
                  setModel('');
                  setStep(3);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-color)' }}
                />
                <span className={styles.brandName}>{cat.name}</span>
              </div>
            ))}
            {availableCategories.length === 0 && (
              <div style={{ gridColumn: 'span 2', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                이 브랜드에 대한 기종 카테고리가 없습니다.
              </div>
            )}
          </div>
          <div className={styles.btnArea}>
            <button className={styles.btnBack} onClick={() => setStep(1)}>이전</button>
          </div>
        </div>
      )}

      {/* Step 3: 시리즈 선택 */}
      {step === 3 && category && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>기기의 시리즈를<br />선택해주세요</h2>
          <div className={styles.listOptions}>
            {availableSeries.map((s) => (
              <div 
                key={s} 
                className={`${styles.modelItem} ${series === s ? styles.modelItemActive : ''}`}
                onClick={() => {
                  setSeries(s);
                  setModel('');
                  setStep(4);
                }}
              >
                <span>{s}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>선택</span>
              </div>
            ))}
          </div>
          <div className={styles.btnArea}>
            <button className={styles.btnBack} onClick={() => setStep(2)}>이전</button>
          </div>
        </div>
      )}

      {/* Step 4: 세부 모델명 선택 */}
      {step === 4 && series && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>최종 세부 모델을<br />선택해주세요</h2>
          <div className={styles.listOptions}>
            {availableModels.map((item) => (
              <div 
                key={item.id} 
                className={`${styles.modelItem} ${model === item.model_name ? styles.modelItemActive : ''}`}
                onClick={() => {
                  setModel(item.model_name);
                  setBasePrice(item.base_price);
                  setStep(5);
                }}
              >
                <span>{item.model_name}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>선택</span>
              </div>
            ))}
          </div>
          <div className={styles.btnArea}>
            <button className={styles.btnBack} onClick={() => setStep(3)}>이전</button>
          </div>
        </div>
      )}

      {/* Step 5: 안심 등급 선택 */}
      {step === 5 && model && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>기기의 실제 외관 및 작동<br />상태를 선택해주세요</h2>
          
          <div className={styles.listOptions} style={{ maxHeight: 'none', gap: '14px' }}>
            <div 
              className={`${styles.modelItem} ${grade === 'S' ? styles.modelItemActive : ''}`}
              onClick={() => { setGrade('S'); setStep(6); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-light)' }}>S급 (흠집 없음)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>차감 없음</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal', margin: 0, textAlign: 'left', lineHeight: '1.4' }}>
                액정 화면 및 기기 전체 외관에 기스나 찍힘이 전혀 없고, 모든 작동 기능이 신품 수준으로 완벽한 상태
              </p>
            </div>

            <div 
              className={`${styles.modelItem} ${grade === 'A' ? styles.modelItemActive : ''}`}
              onClick={() => { setGrade('A'); setStep(6); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-color)' }}>A급 (미세 흠집)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>일부 차감</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal', margin: 0, textAlign: 'left', lineHeight: '1.4' }}>
                화면이나 테두리/뒷면에 미세한 생활 기스, 가벼운 찍힘 흔적이 있으나 정상 작동하는 상태
              </p>
            </div>

            <div 
              className={`${styles.modelItem} ${grade === 'B' ? styles.modelItemActive : ''}`}
              onClick={() => { setGrade('B'); setStep(6); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--danger-color)' }}>B급 (파손 및 다수 기스)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>많은 차감</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal', margin: 0, textAlign: 'left', lineHeight: '1.4' }}>
                액정/유리 깨짐, 깊은 파손 흠집이 다수 있거나 화면 잔상(Burn-in) 및 카메라 등 일부 기능에 이상이 있는 상태
              </p>
            </div>
          </div>

          <div className={styles.btnArea}>
            <button className={styles.btnBack} onClick={() => setStep(4)}>이전</button>
          </div>
        </div>
      )}

      {/* Step 6: 용량 및 색상 선택 */}
      {step === 6 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>기기의 세부 용량과 색상을<br />골라주세요</h2>
          
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
            <button className={styles.btnBack} onClick={() => setStep(5)}>이전</button>
            <button className={styles.btnNext} onClick={() => setStep(7)}>내 예상 견적 확인</button>
          </div>
        </div>
      )}

      {/* Step 7: 견적서 확인 및 신청 폼 */}
      {step === 7 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h2 className={styles.stepTitle}>산출된 예상 매입가를<br />확인하세요</h2>
          
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.priceEstimateCard}>
              <span className={styles.priceLabel}>{model} ({storage} · {grade}급) 예상가</span>
              <span className={styles.priceNumber}>{estimatedPrice.toLocaleString()}원</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* 실물 검수 후 상태 분류에 따라 최종 금액이 조정될 수 있습니다.</span>
            </div>

            {!user ? (
              // 로그인 안 된 사용자
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
                  매입 신청을 완료하기 위해서는<br />본인 인증(전화번호 로그인)이 필요합니다.
                </p>
                <button 
                  onClick={handleLoginRequired} 
                  className={styles.btnNext}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  인증하고 신청 계속하기 <ArrowRight size={18} />
                </button>
                <button className={styles.btnBack} onClick={() => setStep(6)} style={{ width: '100%' }}>이전 단계로</button>
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
                      방문수거 (우체국택배 무료)
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
                  <button type="button" className={styles.btnBack} onClick={() => setStep(6)}>이전</button>
                  <button type="submit" className={styles.btnNext} disabled={loading}>
                    {loading ? '신청 처리 중...' : '최종 매입 신청하기'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Step 8: 신청 완료 화면 */}
      {step === 8 && (
        <div className={`${styles.successWrapper} animate-slide-up`}>
          <CheckCircle2 size={68} color="var(--success-color)" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))' }} />
          <h2 className={styles.successTitle}>매입 신청이<br />성공적으로 접수되었습니다!</h2>
          <p className={styles.successDesc}>
            접수하신 수거지로 전담 택배 기사님이 배정되어 수일 내 방문합니다.<br />
            실물 기기 수거 후 전문 검수팀의 검수를 거쳐 최종 확인 요청을 드립니다.
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
