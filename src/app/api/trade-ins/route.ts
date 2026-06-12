import { NextResponse } from 'next/server';
import { getTradeInRequests, getTradeInRequestsByMember, createTradeInRequest, updateTradeInStatusAndPrice } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    if (memberId) {
      const data = await getTradeInRequestsByMember(memberId);
      return NextResponse.json({ success: true, data });
    } else {
      const data = await getTradeInRequests();
      return NextResponse.json({ success: true, data });
    }
  } catch (error: any) {
    console.error('Trade-ins GET Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      member_id,
      brand,
      category,
      series,
      model_name,
      storage,
      color,
      condition_answers,
      estimated_price,
      shipping_method,
      shipping_address,
      bank_name,
      bank_account,
      account_holder
    } = body;

    // 필수값 유효성 검사
    if (!member_id || !brand || !model_name || !storage || !condition_answers || !shipping_method || !shipping_address) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const newRequest = await createTradeInRequest({
      member_id,
      brand,
      category: category || '스마트폰',
      series: series || '기타 시리즈',
      model_name,
      storage,
      color: color || '',
      condition_answers,
      estimated_price: Number(estimated_price) || 0,
      status: 'pending',
      shipping_method,
      shipping_address,
      bank_name: bank_name || '',
      bank_account: bank_account || '',
      account_holder: account_holder || ''
    });

    return NextResponse.json({ success: true, data: newRequest });
  } catch (error: any) {
    console.error('Trade-ins POST Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, final_price, admin_notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: '매입 신청 ID와 변경할 상태(status)가 누락되었습니다.' }, { status: 400 });
    }

    const updated = await updateTradeInStatusAndPrice(
      id, 
      status, 
      final_price !== undefined ? (final_price === null ? null : Number(final_price)) : undefined, 
      admin_notes
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Trade-ins PUT Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
