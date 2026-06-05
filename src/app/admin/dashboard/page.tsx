'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Smartphone, ShoppingBag, ClipboardList, LogOut, CheckCircle2, AlertCircle, Plus, Edit, Trash2, X, Coins } from 'lucide-react';
import styles from '@/styles/admin.module.css';

// 타입 정의
interface TradeIn {
  id: string;
  brand: string;
  model_name: string;
  storage: string;
  color: string;
  estimated_price: number;
  final_price: number | null;
  status: 'pending' | 'collecting' | 'inspecting' | 'confirmed' | 'paid' | 'cancelled';
  shipping_method: string;
  shipping_address: string;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  admin_notes: string | null;
  created_at: string;
  members: { name: string; phone_number: string } | null;
}

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
}

interface Order {
  id: string;
  price: number;
  status: 'pending' | 'shipping' | 'delivered' | 'cancelled';
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  created_at: string;
  members: { name: string; phone_number: string } | null;
  products: { brand: string; model_name: string; storage: string; color: string; grade: string } | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'trade-ins' | 'products' | 'orders'>('home');
  const [loading, setLoading] = useState(true);

  // 데이터 리스트
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // 모달 제어 상태
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);
  const [selectedTradeIn, setSelectedTradeIn] = useState<TradeIn | null>(null);
  const [tradeInStatus, setTradeInStatus] = useState<string>('pending');
  const [tradeInFinalPrice, setTradeInFinalPrice] = useState<number>(0);
  const [tradeInAdminNotes, setTradeInAdminNotes] = useState<string>('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // null이면 등록, 존재하면 수정
  const [prodBrand, setProdBrand] = useState('Apple');
  const [prodModelName, setProdModelName] = useState('');
  const [prodStorage, setProdStorage] = useState('256GB');
  const [prodColor, setProdColor] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodGrade, setProdGrade] = useState<'S' | 'A' | 'B'>('A');
  const [prodImage, setProdImage] = useState('');
  const [prodDescription, setProdDescription] = useState('');

  // 1. 관리자 토큰 검증
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      loadAllData();
    }
  }, [router]);

  // 전역 데이터 페칭
  const loadAllData = async () => {
    setLoading(true);
    try {
      // 매입 데이터 로드
      const tradeRes = await fetch('/api/trade-ins');
      const tradeData = await tradeRes.json();
      if (tradeData.success) setTradeIns(tradeData.data);

      // 상품 데이터 로드
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.data);

      // 주문 데이터 로드
      const orderRes = await fetch('/api/orders');
      const orderData = await orderRes.json();
      if (orderData.success) setOrders(orderData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. 매입 승인 관리 액션 (수정 모달 오픈)
  const openTradeInModal = (trade: TradeIn) => {
    setSelectedTradeIn(trade);
    setTradeInStatus(trade.status);
    setTradeInFinalPrice(trade.final_price || trade.estimated_price);
    setTradeInAdminNotes(trade.admin_notes || '');
    setIsTradeInModalOpen(true);
  };

  const saveTradeInChanges = async () => {
    if (!selectedTradeIn) return;

    try {
      const res = await fetch('/api/trade-ins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTradeIn.id,
          status: tradeInStatus,
          final_price: tradeInStatus === 'confirmed' || tradeInStatus === 'paid' ? tradeInFinalPrice : null,
          admin_notes: tradeInAdminNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsTradeInModalOpen(false);
        loadAllData();
      } else {
        alert(data.error || '매입 정보 업데이트 실패');
      }
    } catch (err) {
      alert('서버 응답 오류가 발생했습니다.');
    }
  };

  // 3. 중고폰 상품 관리 액션 (등록/수정 모달 오픈)
  const openProductModal = (prod: Product | null = null) => {
    setSelectedProduct(prod);
    if (prod) {
      // 수정 모드
      setProdBrand(prod.brand);
      setProdModelName(prod.model_name);
      setProdStorage(prod.storage);
      setProdColor(prod.color);
      setProdPrice(prod.price);
      setProdGrade(prod.grade);
      setProdImage(prod.images[0] || '');
      setProdDescription(prod.description || '');
    } else {
      // 신규 등록 모드
      setProdBrand('Apple');
      setProdModelName('');
      setProdStorage('256GB');
      setProdColor('');
      setProdPrice(0);
      setProdGrade('A');
      setProdImage('');
      setProdDescription('');
    }
    setIsProductModalOpen(true);
  };

  const saveProduct = async () => {
    if (!prodModelName || !prodColor || !prodPrice) {
      alert('상품 기본 정보를 모두 입력해주세요.');
      return;
    }

    const payload = {
      brand: prodBrand,
      model_name: prodModelName,
      storage: prodStorage,
      color: prodColor,
      price: prodPrice,
      grade: prodGrade,
      images: prodImage ? [prodImage] : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'],
      description: prodDescription,
    };

    try {
      let res;
      if (selectedProduct) {
        // 수정 요청
        res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedProduct.id, ...payload }),
        });
      } else {
        // 신규 추가 요청
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setIsProductModalOpen(false);
        loadAllData();
      } else {
        alert(data.error || '상품 정보 저장 실패');
      }
    } catch (err) {
      alert('서버 처리 오류가 발생했습니다.');
    }
  };

  const deleteProd = async (id: string) => {
    if (!confirm('정말로 이 상품을 쇼핑몰에서 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAllData();
      } else {
        alert('상품 삭제 실패');
      }
    } catch (err) {
      alert('서버 처리 오류');
    }
  };

  // 4. 주문 배송 상태 직접 변경 액션
  const handleOrderStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        loadAllData();
      } else {
        alert('배송 상태 업데이트 실패');
      }
    } catch (err) {
      alert('서버 처리 오류');
    }
  };

  // 관리자 로그아웃
  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  // 지표 계산기
  const getStats = () => {
    const totalPaid = tradeIns
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + (t.final_price || t.estimated_price), 0);
    
    const activeRequests = tradeIns.filter(t => t.status !== 'paid' && t.status !== 'cancelled').length;
    
    const totalSales = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.price, 0);

    return { totalPaid, activeRequests, totalSales };
  };

  const stats = getStats();

  if (loading && tradeIns.length === 0) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '100px 0', fontSize: '14px' }}>
        관리자 콘솔 데이터 로드 중...
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      
      {/* 1. 사이드 바 */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>TRUE MOBILE ADMIN</div>
        
        <nav className={styles.menuList}>
          <button 
            onClick={() => setActiveTab('home')}
            className={`${styles.menuItem} ${activeTab === 'home' ? styles.menuItemActive : ''}`}
          >
            <BarChart3 size={18} /> 대시보드 홈
          </button>
          
          <button 
            onClick={() => setActiveTab('trade-ins')}
            className={`${styles.menuItem} ${activeTab === 'trade-ins' ? styles.menuItemActive : ''}`}
          >
            <Smartphone size={18} /> 매입 신청 관리 ({tradeIns.length})
          </button>
          
          <button 
            onClick={() => setActiveTab('products')}
            className={`${styles.menuItem} ${activeTab === 'products' ? styles.menuItemActive : ''}`}
          >
            <ShoppingBag size={18} /> 판매 상품 관리 ({products.length})
          </button>
          
          <button 
            onClick={() => setActiveTab('orders')}
            className={`${styles.menuItem} ${activeTab === 'orders' ? styles.menuItemActive : ''}`}
          >
            <ClipboardList size={18} /> 주문 배송 관리 ({orders.length})
          </button>
        </nav>

        <button 
          onClick={handleLogout}
          style={{ marginTop: 'auto' }}
          className={styles.menuItem}
        >
          <LogOut size={18} style={{ color: 'var(--danger-color)' }} />
          <span style={{ color: 'var(--danger-color)' }}>로그아웃</span>
        </button>
      </aside>

      {/* 2. 메인 대시보드 */}
      <main className={styles.mainContent}>
        
        {/* 대시보드 홈 탭 */}
        {activeTab === 'home' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>대시보드 종합 요약</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>실시간 거래 집계</span>
            </div>

            {/* 통계 지표 카드 */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>총 매입 정산 지출</span>
                  <span className={styles.metricVal}>{stats.totalPaid.toLocaleString()}원</span>
                </div>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                  <Coins size={22} />
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>진행중인 매입 건수</span>
                  <span className={styles.metricVal}>{stats.activeRequests}건</span>
                </div>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
                  <Smartphone size={22} />
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>총 중고폰 판매 매출</span>
                  <span className={styles.metricVal}>{stats.totalSales.toLocaleString()}원</span>
                </div>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                  <ShoppingBag size={22} />
                </div>
              </div>
            </div>

            {/* 현황 요약 리스트 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <span className={styles.tableTitle}>최근 접수된 매입 신청</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>고객명</th>
                        <th>기종</th>
                        <th>자가진단가</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeIns.slice(0, 5).map(t => (
                        <tr key={t.id}>
                          <td>{t.members?.name || '가입탈퇴'}</td>
                          <td>{t.brand} {t.model_name} ({t.storage})</td>
                          <td>{t.estimated_price.toLocaleString()}원</td>
                          <td>{t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <span className={styles.tableTitle}>최근 접수된 주문</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>구매자</th>
                        <th>금액</th>
                        <th>배송상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td>{o.shipping_name}</td>
                          <td>{o.price.toLocaleString()}원</td>
                          <td>{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 매입 신청 관리 탭 */}
        {activeTab === 'trade-ins' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>매입(수거 및 검수) 관리</h2>
              <button onClick={loadAllData} className={styles.btnCancel} style={{ padding: '8px 14px' }}>새로고침</button>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>신청 날짜</th>
                      <th>고객명 (연락처)</th>
                      <th>제조사/기종</th>
                      <th>용량/색상</th>
                      <th>자가진단금액</th>
                      <th>최종확정가</th>
                      <th>상태</th>
                      <th>검수 액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeIns.map(t => (
                      <tr key={t.id}>
                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                        <td>
                          {t.members?.name || '가입탈퇴'}<br />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {t.members?.phone_number.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                          </span>
                        </td>
                        <td>{t.brand} {t.model_name}</td>
                        <td>{t.storage} / {t.color || '기본'}</td>
                        <td>{t.estimated_price.toLocaleString()}원</td>
                        <td>
                          {t.final_price !== null ? (
                            <span style={{ fontWeight: 'bold', color: 'var(--warning-color)' }}>{t.final_price.toLocaleString()}원</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: t.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : t.status === 'confirmed' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: t.status === 'paid' ? 'var(--success-color)' : t.status === 'confirmed' ? 'var(--warning-color)' : '#fff'
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => openTradeInModal(t)}
                            className={styles.btnCancel}
                            style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--accent-light)', color: 'var(--accent-light)', backgroundColor: 'transparent' }}
                          >
                            상태변경 / 가격조정
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 판매 상품 관리 탭 */}
        {activeTab === 'products' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>중고폰 판매 상품 관리</h2>
              <button onClick={() => openProductModal(null)} className={styles.btnSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> 신규 판매 휴대폰 등록
              </button>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>기기 썸네일</th>
                      <th>브랜드</th>
                      <th>기종 모델명</th>
                      <th>저장 용량</th>
                      <th>색상</th>
                      <th>안심등급</th>
                      <th>판매 가격</th>
                      <th>판매 상태</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={p.images[0]} 
                            alt={p.model_name}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                          />
                        </td>
                        <td>{p.brand}</td>
                        <td style={{ fontWeight: 'bold' }}>{p.model_name}</td>
                        <td>{p.storage}</td>
                        <td>{p.color}</td>
                        <td>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: p.grade === 'S' ? '#d97706' : p.grade === 'A' ? '#4f46e5' : '#4b5563',
                            color: '#fff'
                          }}>
                            {p.grade}급
                          </span>
                        </td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>{p.price.toLocaleString()}원</td>
                        <td>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: p.status === 'available' ? 'var(--success-color)' : 'var(--danger-color)'
                          }}>
                            {p.status === 'available' ? '판매중' : '품절 (판매완료)'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => openProductModal(p)} className={styles.btnCancel} style={{ padding: '6px 10px', fontSize: '11px', border: '1px solid var(--text-secondary)' }}>
                              <Edit size={12} /> 수정
                            </button>
                            <button onClick={() => deleteProd(p.id)} className={styles.btnCancel} style={{ padding: '6px 10px', fontSize: '11px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent' }}>
                              <Trash2 size={12} /> 삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 주문 배송 관리 탭 */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>구매 주문 & 배송 관리</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>총 {orders.length}개 결제 내역</span>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>주문 일자</th>
                      <th>주문 기기</th>
                      <th>배송 수령인</th>
                      <th>연락처</th>
                      <th>배송지 주소</th>
                      <th>주문 금액</th>
                      <th>배송 상태 변경</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td>
                          {o.products ? (
                            <span>
                              {o.products.brand} {o.products.model_name}<br />
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {o.products.storage} / {o.products.color} / {o.products.grade}급
                              </span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>삭제된 상품</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{o.shipping_name}</td>
                        <td>{o.shipping_phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</td>
                        <td>{o.shipping_address}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>{o.price.toLocaleString()}원</td>
                        <td>
                          <select 
                            value={o.status}
                            onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                            className={styles.selectStatus}
                            aria-label="배송 상태 변경"
                          >
                            <option value="pending">입금대기 (pending)</option>
                            <option value="shipping">우체국배송중 (shipping)</option>
                            <option value="delivered">배송완료 (delivered)</option>
                            <option value="cancelled">주문취소 (cancelled)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. 모달 - 매입 검수 및 가격 조정 모달 */}
      {isTradeInModalOpen && selectedTradeIn && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>매입 상태 변경 및 가격 조정</h3>
              <button onClick={() => setIsTradeInModalOpen(false)} style={{ color: 'var(--text-secondary)' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>대상 고객</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedTradeIn.members?.name} ({selectedTradeIn.members?.phone_number})</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>기기 모델</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedTradeIn.brand} {selectedTradeIn.model_name} ({selectedTradeIn.storage})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>고객 자가진단 예상가</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-light)' }}>{selectedTradeIn.estimated_price.toLocaleString()}원</span>
              </div>

              {/* 매입 진행 상태 드롭다운 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="tradeInStatusSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>매입 거래 상태</label>
                <select 
                  id="tradeInStatusSelect"
                  value={tradeInStatus} 
                  onChange={(e) => setTradeInStatus(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="pending">신청완료 (pending)</option>
                  <option value="collecting">수거진행중 (collecting)</option>
                  <option value="inspecting">기기검수중 (inspecting)</option>
                  <option value="confirmed">최종견적조정제시 (confirmed)</option>
                  <option value="paid">정산완료 (paid)</option>
                  <option value="cancelled">매입취소/반송 (cancelled)</option>
                </select>
              </div>

              {/* 최종 가격 조정 필드 (confirmed 상태일 때 필수) */}
              {(tradeInStatus === 'confirmed' || tradeInStatus === 'paid') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="finalPriceInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>실물 최종 감정가 (원)</label>
                  <input 
                    id="finalPriceInput"
                    type="number"
                    value={tradeInFinalPrice}
                    onChange={(e) => setTradeInFinalPrice(Number(e.target.value))}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '10px',
                      color: '#fff',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              )}

              {/* 검수 소견 작성 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="adminNotesTextarea" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>검수 평가 소견 (고객 통보용)</label>
                <textarea 
                  id="adminNotesTextarea"
                  rows={3}
                  value={tradeInAdminNotes}
                  onChange={(e) => setTradeInAdminNotes(e.target.value)}
                  placeholder="예: 액정 모서리 실기스 확인 및 카메라 렌즈 잔기스로 인해 5만원 차감함."
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
            </div>

            <div className={styles.btnGroup}>
              <button onClick={() => setIsTradeInModalOpen(false)} className={styles.btnCancel}>닫기</button>
              <button onClick={saveTradeInChanges} className={styles.btnSave}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 모달 - 상품 신규 등록 / 수정 모달 */}
      {isProductModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                {selectedProduct ? '중고폰 상품 정보 수정' : '중고폰 판매 상품 등록'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} style={{ color: 'var(--text-secondary)' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="brandSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>제조사</label>
                  <select 
                    id="brandSelect"
                    value={prodBrand} 
                    onChange={(e) => setProdBrand(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    <option>Apple</option>
                    <option>Samsung</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="gradeSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>안심 등급</label>
                  <select 
                    id="gradeSelect"
                    value={prodGrade} 
                    onChange={(e) => setProdGrade(e.target.value as 'S' | 'A' | 'B')}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    <option>S</option>
                    <option>A</option>
                    <option>B</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="modelNameInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>모델 명칭</label>
                <input 
                  id="modelNameInput"
                  type="text" 
                  placeholder="예: 아이폰 15 프로"
                  value={prodModelName} 
                  onChange={(e) => setProdModelName(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="storageSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>용량 스펙</label>
                  <select 
                    id="storageSelect"
                    value={prodStorage} 
                    onChange={(e) => setProdStorage(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    <option>128GB</option>
                    <option>256GB</option>
                    <option>512GB</option>
                    <option>1TB</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="colorInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>색상</label>
                  <input 
                    id="colorInput"
                    type="text" 
                    placeholder="예: 내추럴 티타늄"
                    value={prodColor} 
                    onChange={(e) => setProdColor(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="priceInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>판매 금액 (원)</label>
                <input 
                  id="priceInput"
                  type="number" 
                  placeholder="예: 1150000"
                  value={prodPrice} 
                  onChange={(e) => setProdPrice(Number(e.target.value))}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="imageInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>기기 사진 URL (선택)</label>
                <input 
                  id="imageInput"
                  type="text" 
                  placeholder="Unsplash 등 이미지 URL 주소"
                  value={prodImage} 
                  onChange={(e) => setProdImage(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="descriptionTextarea" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>상품 코멘트 설명글</label>
                <textarea 
                  id="descriptionTextarea"
                  rows={3} 
                  placeholder="외관 스크래치 상태, 배터리 효율 정보 등을 입력해주세요."
                  value={prodDescription} 
                  onChange={(e) => setProdDescription(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff', resize: 'none' }}
                />
              </div>
            </div>

            <div className={styles.btnGroup}>
              <button onClick={() => setIsProductModalOpen(false)} className={styles.btnCancel}>취소</button>
              <button onClick={saveProduct} className={styles.btnSave}>저장하기</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
