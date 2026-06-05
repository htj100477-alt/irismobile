'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, ShoppingBag, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/home.module.css';

// 실시간 매입 틱커 데이터
const TICKER_DATA = [
  { model: '아이폰 15 프로 256GB', price: '1,150,000원', status: '정산완료', type: 'complete' },
  { model: '갤럭시 S24 울트라 512GB', price: '1,250,000원', status: '매입신청', type: 'progress' },
  { model: '아이폰 14 128GB', price: '750,000원', status: '수거완료', type: 'complete' },
  { model: '갤럭시 S23 256GB', price: '650,000원', status: '검수완료', type: 'complete' },
  { model: '아이폰 13 프로 128GB', price: '500,000원', status: '검수진행중', type: 'progress' },
];

export default function HomePage() {
  const router = useRouter();
  const [tickerIndex, setTickerIndex] = useState(0);

  // 3초마다 틱커 텍스트 전환 애니메이션
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prevIndex) => (prevIndex + 1) % TICKER_DATA.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <MobileLayout>
      <div className={`${styles.homeContainer} animate-slide-up`}>
        
        {/* 상단 히어로 배너 */}
        <section className={styles.banner}>
          <div className={styles.bannerBadge}>
            <Sparkles size={10} style={{ marginRight: '4px', display: 'inline' }} />
            TRUE FAST SERVICE
          </div>
          <h2 className={styles.bannerTitle}>
            내 폰 최고가 판매,<br />
            당일 즉시 정산받기
          </h2>
          <p className={styles.bannerSubtitle}>
            1분 만에 끝내는 시세 조회부터 당일 정산까지
          </p>
        </section>

        {/* 퀵 액션 그리드 (판매/구매 바로가기) */}
        <section className={styles.actionGrid}>
          <div 
            className={styles.actionCard} 
            onClick={() => router.push('/sell')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && router.push('/sell')}
          >
            <div className={`${styles.iconWrapper} ${styles.sellIcon}`}>
              <Smartphone size={24} />
            </div>
            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>내 폰 최고가에 팔기</h3>
              <p className={styles.cardDesc}>기기 스펙 입력하고 즉시 비교 견적 신청하기</p>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          <div 
            className={styles.actionCard} 
            onClick={() => router.push('/buy')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && router.push('/buy')}
          >
            <div className={`${styles.iconWrapper} ${styles.buyIcon}`}>
              <ShoppingBag size={24} />
            </div>
            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>엄선 중고폰 안심 구매</h3>
              <p className={styles.cardDesc}>엔지니어가 직접 검수한 정품 중고폰 최저가 구매</p>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>
        </section>

        {/* 실시간 거래 현황 (Ticker) */}
        <section className={styles.tickerSection}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.liveDot}></span>
            실시간 매입 접수 및 정산
          </h3>
          <div className={styles.tickerWrapper}>
            <div 
              className={styles.tickerList} 
              style={{ transform: `translateY(-${tickerIndex * 48}px)` }}
            >
              {TICKER_DATA.map((item, idx) => (
                <div key={idx} className={styles.tickerItem}>
                  <span className={styles.tickerModel}>{item.model}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.tickerPrice}>{item.price}</span>
                    <span className={`${styles.tickerStatus} ${item.type === 'complete' ? styles.statusComplete : styles.statusProgress}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 오늘의 중고폰 시세 */}
        <section className={styles.marketSection}>
          <h3 className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
            <span><TrendingUp size={16} style={{ color: 'var(--accent-light)', marginRight: '6px' }} />오늘의 인기 매입 시세</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>A급 기준</span>
          </h3>
          <div className={styles.marketGrid}>
            <div className={styles.marketRow}>
              <div className={styles.marketInfo}>
                <div className={styles.brandLogo} style={{ color: '#fff' }}></div>
                <div>
                  <div className={styles.marketModel}>아이폰 15 프로</div>
                  <div className={styles.marketSpec}>128GB</div>
                </div>
              </div>
              <div className={styles.marketPriceInfo}>
                <div className={styles.marketPrice}>960,000원</div>
                <div className={styles.marketTrend}>▲ 15,000원</div>
              </div>
            </div>

            <div className={styles.marketRow}>
              <div className={styles.marketInfo}>
                <div className={styles.brandLogo} style={{ color: '#fff' }}></div>
                <div>
                  <div className={styles.marketModel}>아이폰 14 프로</div>
                  <div className={styles.marketSpec}>128GB</div>
                </div>
              </div>
              <div className={styles.marketPriceInfo}>
                <div className={styles.marketPrice}>780,000원</div>
                <div className={styles.marketTrend}>▲ 10,000원</div>
              </div>
            </div>

            <div className={styles.marketRow}>
              <div className={styles.marketInfo}>
                <div className={styles.brandLogo} style={{ color: '#034ea2' }}>S</div>
                <div>
                  <div className={styles.marketModel}>갤럭시 S24 울트라</div>
                  <div className={styles.marketSpec}>256GB</div>
                </div>
              </div>
              <div className={styles.marketPriceInfo}>
                <div className={styles.marketPrice}>1,080,000원</div>
                <div className={styles.marketTrend}>▲ 20,000원</div>
              </div>
            </div>

            <div className={styles.marketRow}>
              <div className={styles.marketInfo}>
                <div className={styles.brandLogo} style={{ color: '#034ea2' }}>S</div>
                <div>
                  <div className={styles.marketModel}>갤럭시 S23 울트라</div>
                  <div className={styles.marketSpec}>256GB</div>
                </div>
              </div>
              <div className={styles.marketPriceInfo}>
                <div className={styles.marketPrice}>740,000원</div>
                <div className={styles.marketTrend}>▲ 5,000원</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </MobileLayout>
  );
}
