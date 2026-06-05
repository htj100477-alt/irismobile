'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search } from 'lucide-react';
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

export default function BuyPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // 상품 데이터 로드
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 필터링된 상품 리스트
  const filteredProducts = products.filter((p) => {
    const brandMatch = selectedBrand === 'all' || p.brand === selectedBrand;
    const gradeMatch = selectedGrade === 'all' || p.grade === selectedGrade;
    return brandMatch && gradeMatch;
  });

  return (
    <MobileLayout title="안심 중고폰 상점" showBack={true}>
      <div className={`${styles.buyWrapper} animate-slide-up`}>
        
        {/* 필터 탭 섹션 */}
        <section className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <button 
              className={`${styles.filterTab} ${selectedBrand === 'all' ? styles.filterTabActive : ''}`}
              onClick={() => setSelectedBrand('all')}
            >
              제조사: 전체
            </button>
            <button 
              className={`${styles.filterTab} ${selectedBrand === 'Apple' ? styles.filterTabActive : ''}`}
              onClick={() => setSelectedBrand('Apple')}
            >
               Apple
            </button>
            <button 
              className={`${styles.filterTab} ${selectedBrand === 'Samsung' ? styles.filterTabActive : ''}`}
              onClick={() => setSelectedBrand('Samsung')}
            >
              Samsung
            </button>
          </div>

          <div className={styles.filterGroup}>
            <button 
              className={`${styles.filterTab} ${selectedGrade === 'all' ? styles.filterTabActive : ''}`}
              onClick={() => setSelectedGrade('all')}
            >
              등급: 전체
            </button>
            <button 
              className={`${styles.filterTab} ${selectedGrade === 'S' ? styles.filterTabActive : ''}`}
              onClick={() => setSelectedGrade('S')}
            >
              S급 (새기기 수준)
            </button>
            <button 
              className={`${styles.filterTab} ${selectedGrade === 'A' ? styles.filterTabActive : ''}`}
              onClick={() => setSelectedGrade('A')}
            >
              A급 (미세 기스)
            </button>
            <button 
              className={`${styles.filterTab} ${selectedGrade === 'B' ? styles.filterTabActive : ''}`}
              onClick={() => setSelectedGrade('B')}
            >
              B급 (가성비 추천)
            </button>
          </div>
        </section>

        {/* 상품 그리드 리스트 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            상품 목록을 불러오는 중...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <ShoppingBag size={48} strokeWidth={1} style={{ display: 'block', margin: '0 auto 12px', color: 'var(--text-muted)' }} />
            조건에 맞는 중고폰이 없습니다.
          </div>
        ) : (
          <section className={styles.productGrid}>
            {filteredProducts.map((p) => (
              <div 
                key={p.id} 
                className={styles.productCard}
                onClick={() => router.push(`/buy/${p.id}`)}
              >
                {/* 품절(sold out)인 경우 어두운 오버레이 처리 */}
                {p.status === 'sold' && (
                  <div className={styles.soldOutOverlay}>품절 완료</div>
                )}
                
                <div className={styles.imageWrapper}>
                  {/* 등급 표시 */}
                  <span className={`${styles.gradeBadge} ${
                    p.grade === 'S' ? styles.gradeS : p.grade === 'A' ? styles.gradeA : styles.gradeB
                  }`}>
                    {p.grade}급
                  </span>
                  
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={p.images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'} 
                    alt={p.model_name}
                    className={styles.productImage}
                  />
                </div>

                <div className={styles.productInfo}>
                  <span className={styles.productBrand}>{p.brand}</span>
                  <h3 className={styles.productTitle}>{p.model_name}</h3>
                  <span className={styles.productSpecs}>{p.storage} · {p.color}</span>
                  <span className={styles.productPrice}>{p.price.toLocaleString()}원</span>
                </div>
              </div>
            ))}
          </section>
        )}

      </div>
    </MobileLayout>
  );
}
