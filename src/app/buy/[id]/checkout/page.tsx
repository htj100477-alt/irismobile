'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, CreditCard, CheckCircle2, ShoppingBag } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/sell.module.css'; // sell.module.css의 폼 스타일을 함께 재사용

interface Product {
  id: string;
  brand: string;
  model_name: string;
  storage: string;
  color: string;
  price: number;
  grade: 'S' | 'A' | 'B';
  images: string[];
  description: string;
  status: 'available' | 'reserved' | 'sold';
  created_at: string;
}

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

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 폼 입력 상태
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  
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

  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // 로그인 상태 및 제품 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        // 비로그인 시 튕겨내기
        router.push(`/auth?redirect=/buy/${resolvedParams.id}/checkout`);
        return;
      }
      
      const loggedUser = JSON.parse(savedUser);
      setUser(loggedUser);
      
      // 이름, 폰 번호 디폴트 세팅
      setShippingName(loggedUser.name || '');
      
      // 휴대폰 번호 포맷팅 추가하여 기입
      const rawPhone = loggedUser.phone_number || '';
      if (rawPhone.length === 11) {
        setShippingPhone(`${rawPhone.slice(0, 3)}-${rawPhone.slice(3, 7)}-${rawPhone.slice(7)}`);
      } else {
        setShippingPhone(rawPhone);
      }

      try {
        const res = await fetch(`/api/products/${resolvedParams.id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
          // 이미 팔린 상품인 경우 팅겨내기
          if (data.data.status === 'sold') {
            alert('이미 판매 완료된 상품입니다.');
            router.push('/buy');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [resolvedParams.id, router]);

  // 주문 제출 처리
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;

    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      setError('배송 정보를 모두 정확하게 입력해 주세요.');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: user.id,
          product_id: product.id,
          price: product.price,
          shipping_name: shippingName,
          shipping_phone: shippingPhone.replace(/[^0-9]/g, ''),
          shipping_address: shippingAddress
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setError(data.error || '주문 요청 제출 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('서버 결제망 연동에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout showBack={true} title="주문 결제 진행">
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
          결제 시스템 구동 중...
        </div>
      </MobileLayout>
    );
  }

  if (!product) {
    return (
      <MobileLayout showBack={true} title="주문 오류">
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
          해당 중고폰 정보를 조회할 수 없습니다.
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBack={true} title="안심 중고폰 주문">
      <div className={`${styles.sellWrapper} animate-slide-up`} style={{ minHeight: 'calc(100vh - 120px)' }}>
        
        {!isSuccess ? (
          <>
            <h2 className={styles.stepTitle}>배송 정보를 입력하고<br />구매를 완료하세요</h2>
            
            {/* 상품 간략 요약 카드 */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={product.images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'} 
                alt={product.model_name}
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>{product.model_name}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{product.storage} · {product.color} · {product.grade}급</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-light)', marginTop: '4px' }}>{product.price.toLocaleString()}원</p>
              </div>
            </div>

            {/* 주문 폼 */}
            <form onSubmit={handleSubmitOrder} className={styles.formSection}>
              
              {/* 배송지 입력 그룹 */}
              <div className={styles.questionCard} style={{ margin: 0 }}>
                <h3 className={styles.questionText} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={18} style={{ color: 'var(--accent-light)' }} /> 배송지 정보
                </h3>
                
                <div className={styles.formGroup} style={{ marginTop: '10px' }}>
                  <label htmlFor="shippingNameInput" className={styles.formLabel}>수령인 성명</label>
                  <input 
                    id="shippingNameInput"
                    type="text" 
                    placeholder="이름을 입력하세요"
                    className={styles.formInput}
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="shippingPhoneInput" className={styles.formLabel}>연락처 번호</label>
                  <input 
                    id="shippingPhoneInput"
                    type="tel" 
                    placeholder="010-0000-0000"
                    className={styles.formInput}
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>수령 주소</label>
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
              </div>

              {/* 결제 정보 (가상 계좌 이체 예시) */}
              <div className={styles.questionCard} style={{ margin: 0 }}>
                <h3 className={styles.questionText} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} style={{ color: 'var(--accent-light)' }} /> 결제 수단
                </h3>
                
                <div style={{ marginTop: '10px' }}>
                  <div className={styles.radioItemActive} style={{ border: '1px solid var(--accent-light)', padding: '14px', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>
                    안전 가상계좌 무통장입금
                  </div>
                  <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    marginTop: '8px',
                    border: '1px dashed var(--border-color)'
                  }}>
                    🏦 **무통장 입금 계좌 안내**:<br />
                    - **은행**: 기업은행<br />
                    - **계좌**: `010-7744-5064`<br />
                    - **예금주**: 이상민<br />
                    * 입금 확인 후 배송 및 배송 등록이 즉시 진행됩니다.
                  </div>
                </div>
              </div>

              {error && <p className={styles.errorText}>{error}</p>}

              <button type="submit" className={styles.btnNext} style={{ width: '100%' }} disabled={submitLoading}>
                {submitLoading ? '주문 처리 중...' : `${product.price.toLocaleString()}원 결제 요청하기`}
              </button>
            </form>
          </>
        ) : (
          /* 주문 성공 완료뷰 */
          <div className={`${styles.successWrapper} animate-slide-up`}>
            <CheckCircle2 size={68} color="var(--success-color)" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))' }} />
            <h2 className={styles.successTitle}>안심 중고폰 주문이<br />완료되었습니다!</h2>
            <p className={styles.successDesc}>
              입금계좌로 입금이 확인되면 검수 전용 에어캡 안심 포장 과정을 거쳐 당일 배송 출발합니다.<br />
              배송이 출발하면 등록된 연락처로 등기 송장 번호 안내 문자를 전송해 드립니다.
            </p>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '13px',
              textAlign: 'left',
              width: '100%',
              margin: '16px 0',
              lineHeight: '1.6'
            }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>🏦 입금 계좌 정보</span><br />
              - **은행**: 기업은행<br />
              - **계좌번호**: `010-7744-5064`<br />
              - **예금주**: 이상민<br />
              - **입금 금액**: <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>{product.price.toLocaleString()}원</span>
            </div>
            <button 
              onClick={() => router.push('/mypage')} 
              className={styles.btnNext}
              style={{ width: '80%' }}
            >
              내 주문 내역 확인하기
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
    </MobileLayout>
  );
}
