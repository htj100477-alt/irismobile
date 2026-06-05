'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShieldAlert, ShieldCheck } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/buy.module.css';

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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // 상품 데이터 및 유저 세션 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        const res = await fetch(`/api/products/${resolvedParams.id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [resolvedParams.id]);

  // 구매하기 클릭 핸들러
  const handleBuyClick = () => {
    if (!product) return;
    
    if (!user) {
      // 비로그인 시 인증으로 우회 (구매 경로 유지)
      router.push(`/auth?redirect=/buy/${product.id}/checkout`);
    } else {
      router.push(`/buy/${product.id}/checkout`);
    }
  };

  const getGradeText = (grade: string) => {
    switch (grade) {
      case 'S': return '새 것과 다름없는 무결점 S급 기기';
      case 'A': return '눈에 잘 띄지 않는 미세 생활 기스 A급 기기';
      case 'B': return '가성비가 아주 훌륭한 기능 정상 B급 기기';
      default: return '검수 완료 기기';
    }
  };

  if (loading) {
    return (
      <MobileLayout showBack={true} title="기기 상세 정보">
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
          기기 정보를 불러오는 중...
        </div>
      </MobileLayout>
    );
  }

  if (!product) {
    return (
      <MobileLayout showBack={true} title="기기 찾을 수 없음">
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
          존재하지 않는 상품이거나 이미 판매 완료되었습니다.
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBack={true} title={`${product.brand} 상세정보`}>
      <div className={`${styles.detailWrapper} animate-slide-up`}>
        
        {/* 제품 대표 이미지 */}
        <div className={styles.detailImageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={product.images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'} 
            alt={product.model_name}
            className={styles.detailImage}
          />
        </div>

        {/* 제품 기본 인포 */}
        <section className={styles.detailMeta}>
          <div className={styles.detailTitleRow}>
            <span className={`${styles.gradeBadge} ${
              product.grade === 'S' ? styles.gradeS : product.grade === 'A' ? styles.gradeA : styles.gradeB
            }`} style={{ position: 'static' }}>
              {product.grade}급
            </span>
            <h2 className={styles.detailTitle}>{product.model_name}</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{getGradeText(product.grade)}</p>
        </section>

        {/* 제품 스펙 명세서 */}
        <section className={styles.detailSpecList}>
          <div className={styles.specRow}>
            <span className={styles.specLabel}>저장 용량</span>
            <span className={styles.specVal}>{product.storage}</span>
          </div>
          <div className={styles.specRow}>
            <span className={styles.specLabel}>색상</span>
            <span className={styles.specVal}>{product.color}</span>
          </div>
          <div className={styles.specRow}>
            <span className={styles.specLabel}>배터리 효율</span>
            <span className={styles.specVal} style={{ color: 'var(--success-color)' }}>
              {product.grade === 'S' ? '96% 이상' : product.grade === 'A' ? '88% 이상' : '82% 이상'} (성능 우수)
            </span>
          </div>
          <div className={styles.specRow}>
            <span className={styles.specLabel}>통신사 제한</span>
            <span className={styles.specVal}>3사 공용 (알뜰폰/자급제 가능)</span>
          </div>
        </section>

        {/* 트루모바일 안심 보장 마크 */}
        <section style={{
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          padding: '16px',
          borderRadius: 'var(--border-radius-md)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <ShieldCheck size={20} style={{ color: 'var(--success-color)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>트루 안심 무상 보증 케어</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              본 제품은 전문 정밀 엔지니어의 25개 검수 항목 테스트를 모두 마친 정품 기기입니다. 구매일로부터 6개월간 무상 보증 수리를 지원합니다.
            </p>
          </div>
        </section>

        {/* 상세 설명글 */}
        {product.description && (
          <section className={styles.detailDesc}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>판매자 코멘트</h4>
            <p>{product.description}</p>
          </section>
        )}

        {/* 하단 구매 액션바 */}
        <div className={styles.bottomAction}>
          <div className={styles.actionPriceInfo}>
            <span className={styles.actionPriceLabel}>안심 거래 대금</span>
            <span className={styles.actionPriceVal}>{product.price.toLocaleString()}원</span>
          </div>
          
          <button 
            onClick={handleBuyClick} 
            className={styles.btnBuy}
            disabled={product.status === 'sold'}
          >
            {product.status === 'sold' ? '품절된 상품' : '구매하기'}
          </button>
        </div>

      </div>
    </MobileLayout>
  );
}
