'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ArrowRightLeft, ShoppingBag, ClipboardList, CheckCircle2, XCircle, Clock, Truck, Coins, ShieldAlert } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import styles from '@/styles/sell.module.css'; // 공통 스타일 활용

interface TradeIn {
  id: string;
  brand: string;
  model_name: string;
  storage: string;
  color: string;
  condition_answers: any;
  estimated_price: number;
  final_price: number | null;
  status: 'pending' | 'collecting' | 'inspecting' | 'confirmed' | 'paid' | 'cancelled';
  shipping_method: 'pickup' | 'parcel';
  shipping_address: string;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  admin_notes: string | null;
  created_at: string;
}

interface Order {
  id: string;
  price: number;
  status: 'pending' | 'shipping' | 'delivered' | 'cancelled';
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  created_at: string;
  products: {
    brand: string;
    model_name: string;
    storage: string;
    color: string;
    grade: string;
    images: string[];
  } | null;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sell' | 'buy'>('sell');
  
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 세션 정보 로딩 및 DB 페칭
  useEffect(() => {
    const loadSessionAndData = async () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        setLoading(false);
        return;
      }

      let loggedUser = JSON.parse(savedUser);
      setUser(loggedUser);

      // 최신 프로필 정보 동기화 (역할/이름 변경 사항 반영)
      try {
        const profileRes = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_profile', phone_number: loggedUser.phone_number }),
        });
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.success && profileData.member) {
          loggedUser = profileData.member;
          localStorage.setItem('user', JSON.stringify(loggedUser));
          setUser(loggedUser);
        }
      } catch (err) {
        console.error('Failed to sync profile:', err);
      }

      try {
        // 매입 내역 로드
        const tradeRes = await fetch(`/api/trade-ins?member_id=${loggedUser.id}`);
        const tradeData = await tradeRes.json();
        if (tradeData.success) {
          setTradeIns(tradeData.data);
        }

        // 구매 내역 로드
        const orderRes = await fetch(`/api/orders?member_id=${loggedUser.id}`);
        const orderData = await orderRes.json();
        if (orderData.success) {
          setOrders(orderData.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSessionAndData();
  }, []);

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setTradeIns([]);
    setOrders([]);
    router.push('/');
  };

  // 매입 최종 금액 승인/거절 액션
  const handleConfirmPrice = async (id: string, accept: boolean) => {
    setActionLoading(id);
    const nextStatus = accept ? 'paid' : 'cancelled'; // 승인 시 paid(정산완료), 거절 시 cancelled(취소/반송)
    
    try {
      const res = await fetch('/api/trade-ins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        // 로컬 상태 동기화
        setTradeIns(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
      } else {
        alert(data.error || '승인 처리 도중 실패했습니다.');
      }
    } catch (err) {
      alert('서버 응답 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // 매입 상태 배지 변환기
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span style={{ backgroundColor: 'rgba(95, 93, 236, 0.1)', color: 'var(--accent-light)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>신청완료</span>;
      case 'collecting':
        return <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>방문수거중</span>;
      case 'inspecting':
        return <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>기기검수중</span>;
      case 'confirmed':
        return <span style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>견적승인대기</span>;
      case 'paid':
        return <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>정산완료</span>;
      case 'cancelled':
        return <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>취소/반송</span>;
      default:
        return null;
    }
  };

  // 구매 배송 상태 배지 변환기
  const renderDeliveryBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>입금확인대기</span>;
      case 'shipping':
        return <span style={{ backgroundColor: 'rgba(95, 93, 236, 0.1)', color: 'var(--accent-light)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>우체국배송중</span>;
      case 'delivered':
        return <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>배송완료</span>;
      case 'cancelled':
        return <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>주문취소</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <MobileLayout title="마이페이지">
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
          내 정보 로딩 중...
        </div>
      </MobileLayout>
    );
  }

  // 로그인 상태가 아닐 때 렌더링
  if (!user) {
    return (
      <MobileLayout title="마이페이지" showBack={false}>
        <div className="animate-fade-in" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: 'calc(100vh - 180px)',
          gap: '16px'
        }}>
          <User size={64} color="var(--text-muted)" style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '50%' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>가입 정보가 없거나<br />로그아웃 상태입니다.</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: '1.5' }}>
            간편한 휴대폰 번호 로그인 후 주문 내역 관리 및 정산 현황 확인이 가능합니다.
          </p>
          <button 
            onClick={() => router.push('/auth?redirect=/mypage')}
            className={styles.btnNext}
            style={{ width: '80%', padding: '14px', marginTop: '8px' }}
          >
            본인인증 로그인하기
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="마이페이지" showBack={false}>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 관리자 등급용 대시보드 바로가기 배너 */}
        {(user.role === 'admin' || user.role === 'manager' || user.role === 'staff') && (
          <section style={{
            background: 'var(--accent-gradient)',
            borderRadius: 'var(--border-radius-md)',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(95, 93, 236, 0.2)'
          }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                {user.role === 'admin' ? '어드민 권한 접속 중' : user.role === 'manager' ? '매니저 권한 접속 중' : '스탭 권한 접속 중'}
              </h4>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '2px' }}>
                관리자 대시보드에서 업무를 관리할 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem('admin_token', 'true');
                sessionStorage.setItem('admin_role', user.role);
                sessionStorage.setItem('admin_role_name', user.role === 'admin' ? '어드민' : user.role === 'manager' ? '매니저' : '스탭');
                router.push('/admin/dashboard');
              }}
              style={{
                backgroundColor: '#fff',
                color: 'var(--accent-color)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              대시보드 이동 <ArrowRightLeft size={14} />
            </button>
          </section>
        )}

        {/* 회원 카드 */}
        <section style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-light)'
            }}>
              <User size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>{user.name} 고객님</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {user.phone_number.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--danger-color)',
              fontWeight: '600',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.05)'
            }}
          >
            <LogOut size={12} /> 로그아웃
          </button>
        </section>

        {/* 내역 전환 탭 단추 */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '4px',
          border: '1px solid var(--border-color)'
        }}>
          <button 
            onClick={() => setActiveTab('sell')}
            style={{
              padding: '10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: activeTab === 'sell' ? '#fff' : 'var(--text-secondary)',
              backgroundColor: activeTab === 'sell' ? 'var(--accent-color)' : 'transparent',
              transition: 'var(--transition-smooth)'
            }}
          >
            내 판매 내역 ({tradeIns.length})
          </button>
          <button 
            onClick={() => setActiveTab('buy')}
            style={{
              padding: '10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: activeTab === 'buy' ? '#fff' : 'var(--text-secondary)',
              backgroundColor: activeTab === 'buy' ? 'var(--accent-color)' : 'transparent',
              transition: 'var(--transition-smooth)'
            }}
          >
            내 구매 내역 ({orders.length})
          </button>
        </section>

        {/* 내역 리스트 렌더링 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* 1. 매입 신청 리스트 (내폰판매) */}
          {activeTab === 'sell' && (
            tradeIns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                <ArrowRightLeft size={36} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
                신청한 매입 거래 내역이 없습니다.
              </div>
            ) : (
              tradeIns.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* 매입 헤더 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString('ko-KR')} 접수
                    </span>
                    {renderStatusBadge(item.status)}
                  </div>

                  {/* 상세 기기 명세 */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.brand} {item.model_name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      용량: {item.storage} · 색상: {item.color || '기본색'}
                    </p>
                  </div>

                  {/* 가격 요약 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '10px',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>자가진단가:</span>
                    <span style={{ fontWeight: 'bold' }}>{item.estimated_price.toLocaleString()}원</span>
                  </div>

                  {/* 검수 후 최종 확정 견적이 나온 경우 (승인 대기) */}
                  {item.status === 'confirmed' && item.final_price !== null && (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.05)',
                      border: '1px dashed #d97706',
                      borderRadius: '8px',
                      padding: '12px',
                      marginTop: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#fbbf24' }}>
                        <ShieldAlert size={14} /> 최종 조율 견적서 발행됨
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>실물 최종 감정가:</span>
                        <span style={{ fontWeight: '900', color: 'var(--warning-color)', fontSize: '14px' }}>
                          {item.final_price.toLocaleString()}원
                        </span>
                      </div>

                      {item.admin_notes && (
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', backgroundColor: 'var(--bg-tertiary)', padding: '6px 8px', borderRadius: '4px' }}>
                          📝 **검수자 소견**: {item.admin_notes}
                        </p>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        <button 
                          className={styles.btnBack} 
                          style={{ padding: '8px', fontSize: '12px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent' }}
                          onClick={() => handleConfirmPrice(item.id, false)}
                          disabled={actionLoading === item.id}
                        >
                          거절 (반송요청)
                        </button>
                        <button 
                          className={styles.btnNext} 
                          style={{ padding: '8px', fontSize: '12px', backgroundColor: 'var(--success-color)' }}
                          onClick={() => handleConfirmPrice(item.id, true)}
                          disabled={actionLoading === item.id}
                        >
                          최종 견적 승인
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 정산완료된 내역일 때 최종 정산가 표시 */}
                  {item.status === 'paid' && item.final_price !== null && (
                    <div style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: '8px',
                      padding: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: 'var(--success-color)'
                    }}>
                      <span>실제 최종 정산금액:</span>
                      <span style={{ fontWeight: 'bold' }}>{item.final_price.toLocaleString()}원 입금 완료</span>
                    </div>
                  )}
                </div>
              ))
            )
          )}

          {/* 2. 구매 내역 리스트 (중고폰구매) */}
          {activeTab === 'buy' && (
            orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                <ShoppingBag size={36} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
                구매하신 주문 거래 내역이 없습니다.
              </div>
            ) : (
              orders.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* 주문 헤더 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString('ko-KR')} 주문
                    </span>
                    {renderDeliveryBadge(item.status)}
                  </div>

                  {/* 주문 상품 명세 */}
                  {item.products ? (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={item.products.images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'} 
                        alt={item.products.model_name}
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', backgroundColor: 'var(--bg-tertiary)' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.products.brand} {item.products.model_name}</h4>
                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {item.products.storage} · {item.products.color} · {item.products.grade}급 기기
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>기기 정보 조회 실패 (삭제된 상품)</div>
                  )}

                  {/* 결제금액 요약 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '10px',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>결제 대금 (무통장입금):</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>{item.price.toLocaleString()}원</span>
                  </div>

                  {/* 배송 상태 중일 때 가상 송장 표시 */}
                  {item.status === 'shipping' && (
                    <div style={{
                      backgroundColor: 'rgba(95, 93, 236, 0.05)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Truck size={14} style={{ color: 'var(--accent-light)' }} />
                      <span>**배송 송장**: 우체국 택배 `7234-9128-4031`</span>
                    </div>
                  )}
                </div>
              ))
            )
          )}

        </section>

      </div>
    </MobileLayout>
  );
}
