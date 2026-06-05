'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, RotateCcw } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/buy.module.css';

interface Product {
  id: string;
  brand: string;
  model_name: string;
  category: string;
  series: string;
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
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태들
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStorage, setSelectedStorage] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');

  // 적용된 필터 요약 텍스트
  const getFilterSummary = () => {
    const summary = [];
    if (selectedCategory !== 'all') summary.push(selectedCategory);
    if (selectedBrand !== 'all') summary.push(selectedBrand);
    if (selectedSeries !== 'all') summary.push(selectedSeries);
    if (selectedModel !== 'all') summary.push(selectedModel);
    if (selectedGrade !== 'all') summary.push(`${selectedGrade}급`);
    if (selectedStorage !== 'all') summary.push(selectedStorage);
    if (selectedPriceRange !== 'all') {
      const pText = 
        selectedPriceRange === 'under30' ? '30만↓' :
        selectedPriceRange === '30to70' ? '30-70만' :
        selectedPriceRange === '70to120' ? '70-120만' :
        selectedPriceRange === 'over120' ? '120만↑' : '';
      if (pText) summary.push(pText);
    }
    return summary.length > 0 ? summary.join(' · ') : '전체 상품';
  };

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 상품 로드
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (prodData.success) {
          setProducts(prodData.data);
        }

        // 2. 카테고리 로드
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.data);
        }
      } catch (err) {
        console.error('Data fetching error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 필터 초기화 함수
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedSeries('all');
    setSelectedModel('all');
    setSelectedGrade('all');
    setSelectedStorage('all');
    setSelectedPriceRange('all');
  };

  // 선택 값에 기반한 동적 필터 옵션 추출 (유효한 상품 목록 기준)
  const availableBrands = ['all', ...Array.from(new Set(
    products
      .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
      .map(p => p.brand)
  ))];

  const availableSeries = ['all', ...Array.from(new Set(
    products
      .filter(p => {
        const catMatch = selectedCategory === 'all' || p.category === selectedCategory;
        const brandMatch = selectedBrand === 'all' || p.brand === selectedBrand;
        return catMatch && brandMatch;
      })
      .map(p => p.series)
  ))];

  const availableModels = ['all', ...Array.from(new Set(
    products
      .filter(p => {
        const catMatch = selectedCategory === 'all' || p.category === selectedCategory;
        const brandMatch = selectedBrand === 'all' || p.brand === selectedBrand;
        const seriesMatch = selectedSeries === 'all' || p.series === selectedSeries;
        return catMatch && brandMatch && seriesMatch;
      })
      .map(p => p.model_name)
  ))];

  const availableStorages = ['all', ...Array.from(new Set(
    products
      .filter(p => {
        const catMatch = selectedCategory === 'all' || p.category === selectedCategory;
        const brandMatch = selectedBrand === 'all' || p.brand === selectedBrand;
        const seriesMatch = selectedSeries === 'all' || p.series === selectedSeries;
        const modelMatch = selectedModel === 'all' || p.model_name === selectedModel;
        return catMatch && brandMatch && seriesMatch && modelMatch;
      })
      .map(p => p.storage)
  ))];

  // 가격 매칭 함수
  const matchPrice = (price: number, range: string) => {
    if (range === 'all') return true;
    if (range === 'under30') return price <= 300000;
    if (range === '30to70') return price > 300000 && price <= 700000;
    if (range === '70to120') return price > 700000 && price <= 1200000;
    if (range === 'over120') return price > 1200000;
    return true;
  };

  // 최종 필터링된 상품 목록
  const filteredProducts = products.filter((p) => {
    const catMatch = selectedCategory === 'all' || p.category === selectedCategory;
    const brandMatch = selectedBrand === 'all' || p.brand === selectedBrand;
    const seriesMatch = selectedSeries === 'all' || p.series === selectedSeries;
    const modelMatch = selectedModel === 'all' || p.model_name === selectedModel;
    const gradeMatch = selectedGrade === 'all' || p.grade === selectedGrade;
    const storageMatch = selectedStorage === 'all' || p.storage === selectedStorage;
    const priceMatch = matchPrice(p.price, selectedPriceRange);

    return catMatch && brandMatch && seriesMatch && modelMatch && gradeMatch && storageMatch && priceMatch;
  });

  return (
    <MobileLayout title="안심 중고 장터" showBack={true}>
      <div className={`${styles.buyWrapper} animate-slide-up`}>
        
        {/* 상단 원형 카테고리 캐러셀 */}
        <section className={styles.categoryCarousel}>
          <div 
            className={`${styles.categoryCard} ${selectedCategory === 'all' ? styles.categoryCardActive : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setSelectedBrand('all');
              setSelectedSeries('all');
              setSelectedModel('all');
            }}
          >
            <div className={`${styles.categoryImageCircle} ${selectedCategory === 'all' ? styles.categoryImageCircleActive : ''}`} style={{ background: 'linear-gradient(135deg, var(--accent-color) 0%, #1e1b4b 100%)' }}>
              <Search size={22} color="#fff" />
            </div>
            <span className={styles.categoryName}>전체</span>
          </div>

          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className={`${styles.categoryCard} ${selectedCategory === cat.name ? styles.categoryCardActive : ''}`}
              onClick={() => {
                setSelectedCategory(cat.name);
                setSelectedBrand('all');
                setSelectedSeries('all');
                setSelectedModel('all');
              }}
            >
              <div className={`${styles.categoryImageCircle} ${selectedCategory === cat.name ? styles.categoryImageCircleActive : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cat.image} alt={cat.name} />
              </div>
              <span className={styles.categoryName}>{cat.name}</span>
            </div>
          ))}
        </section>

        {/* 원하는 상품찾기 상세 검색 패널 (Fongabi 스타일) */}
        <section className={styles.searchPanel}>
          <div className={styles.searchPanelTitleRow}>
            <h3 className={styles.searchPanelTitle}>
              <Search size={16} className="text-accent-light" />
              원하는 기기 상세검색
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className={styles.btnReset} onClick={handleResetFilters}>
                <RotateCcw size={12} />
                필터 초기화
              </button>
              <button 
                className={styles.btnToggleFilter}
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                aria-label="필터 접기/펼치기"
              >
                {isFilterExpanded ? '접기 ▲' : '펼치기 ▼'}
              </button>
            </div>
          </div>

          {isFilterExpanded ? (
            <>
              {/* 1단계: 제조사 선택 */}
              <div className={styles.filterSection}>
                <span className={styles.filterLabel}>제조사</span>
                <div className={styles.chipContainer}>
                  {availableBrands.map(b => (
                    <button 
                      key={b}
                      className={`${styles.chip} ${selectedBrand === b ? styles.chipActive : ''}`}
                      onClick={() => {
                        setSelectedBrand(b);
                        setSelectedSeries('all');
                        setSelectedModel('all');
                      }}
                    >
                      {b === 'all' ? '전체' : b}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2단계: 시리즈 선택 (선택된 브랜드/카테고리에 따른 동적 렌더링) */}
              {availableSeries.length > 1 && (
                <div className={styles.filterSection}>
                  <span className={styles.filterLabel}>시리즈</span>
                  <div className={styles.chipContainer}>
                    {availableSeries.map(s => (
                      <button 
                        key={s}
                        className={`${styles.chip} ${selectedSeries === s ? styles.chipActive : ''}`}
                        onClick={() => {
                          setSelectedSeries(s);
                          setSelectedModel('all');
                        }}
                      >
                        {s === 'all' ? '전체' : s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3단계: 모델 선택 (선택된 브랜드/카테고리/시리즈에 따른 동적 렌더링) */}
              {availableModels.length > 1 && (
                <div className={styles.filterSection}>
                  <span className={styles.filterLabel}>세부 모델</span>
                  <div className={styles.chipContainer}>
                    {availableModels.map(m => (
                      <button 
                        key={m}
                        className={`${styles.chip} ${selectedModel === m ? styles.chipActive : ''}`}
                        onClick={() => {
                          setSelectedModel(m);
                          if (m !== 'all') {
                            setIsFilterExpanded(false);
                          }
                        }}
                      >
                        {m === 'all' ? '전체' : m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4단계: 드롭다운 필터 (등급, 용량, 가격대) */}
              <div className={styles.dropdownFilters}>
                <select 
                  className={styles.dropdownSelect}
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  aria-label="등급 선택"
                >
                  <option value="all">등급: 전체</option>
                  <option value="S">S급 (최상급)</option>
                  <option value="A">A급 (미세흠집)</option>
                  <option value="B">B급 (가성비)</option>
                </select>

                <select 
                  className={styles.dropdownSelect}
                  value={selectedStorage}
                  onChange={(e) => setSelectedStorage(e.target.value)}
                  aria-label="용량 선택"
                >
                  <option value="all">용량: 전체</option>
                  {availableStorages.filter(st => st !== 'all').map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <select 
                  className={styles.dropdownSelect}
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  aria-label="가격대 선택"
                >
                  <option value="all">가격: 전체</option>
                  <option value="under30">30만원 이하</option>
                  <option value="30to70">30만 ~ 70만원</option>
                  <option value="70to120">70만 ~ 120만원</option>
                  <option value="over120">120만원 이상</option>
                </select>
              </div>
            </>
          ) : (
            <div className={styles.filterSummaryBar} onClick={() => setIsFilterExpanded(true)}>
              <span className={styles.filterSummaryText}>
                {getFilterSummary()}
              </span>
              <span className={styles.btnExpand}>
                필터 변경하기 <Search size={12} />
              </span>
            </div>
          )}
        </section>

        {/* 상품 그리드 리스트 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            상품 목록을 불러오는 중...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <ShoppingBag size={48} strokeWidth={1} style={{ display: 'block', margin: '0 auto 12px', color: 'var(--text-muted)' }} />
            조건에 맞는 상품이 없습니다.
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
                  <span className={styles.productSpecs}>{p.category} · {p.storage} · {p.color}</span>
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
