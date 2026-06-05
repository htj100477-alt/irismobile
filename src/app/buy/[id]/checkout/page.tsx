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
                  <label htmlFor="shippingAddressInput" className={styles.formLabel}>수령 주소</label>
                  <input 
                    id="shippingAddressInput"
                    type="text" 
                    placeholder="배송받으실 주소"
                    className={styles.formInput}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    required
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
                    🏦 **가상 입금 계좌 안내**:<br />
                    - **은행**: 국민은행<br />
                    - **계좌**: `923456-04-123456`<br />
                    - **예금주**: (주)트루모바일<br />
                    * 주문 접수 후 24시간 이내 미입금 시 자동 취소됩니다.
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
              선택하신 결제 계좌로 입금이 확인되면 검수 전용 에어캡 안심 포장 과정을 거쳐 당일 배송 출발합니다.<br />
              배송이 출발하면 등록된 연락처로 등기 송장 번호 안내 문자를 전송해 드립니다.
            </p>
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
