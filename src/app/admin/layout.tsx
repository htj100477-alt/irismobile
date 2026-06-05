import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '트루 모바일 - 판매자 관리자 대시보드',
  description: '매입 및 판매 현황을 관리하고 중고폰 재고를 관리하는 판매자 전용 페이지입니다.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#090d16' }}>
      {children}
    </div>
  );
}
