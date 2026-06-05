import { NextResponse } from 'next/server';
import { getOrders, getOrdersByMember, createOrder, updateOrderStatus } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    if (memberId) {
      const data = await getOrdersByMember(memberId);
      return NextResponse.json({ success: true, data });
    } else {
      const data = await getOrders();
      return NextResponse.json({ success: true, data });
    }
  } catch (error: any) {
    console.error('Orders GET Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { member_id, product_id, price, shipping_name, shipping_phone, shipping_address } = body;

    if (!member_id || !product_id || !price || !shipping_name || !shipping_phone || !shipping_address) {
      return NextResponse.json({ error: '주문 정보가 누락되었습니다.' }, { status: 400 });
    }

    const newOrder = await createOrder({
      member_id,
      product_id,
      price: Number(price),
      shipping_name,
      shipping_phone,
      shipping_address,
      status: 'pending' // 주문완료
    });

    return NextResponse.json({ success: true, data: newOrder });
  } catch (error: any) {
    console.error('Orders POST Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: '주문 ID와 상태(status) 정보가 누락되었습니다.' }, { status: 400 });
    }

    const updated = await updateOrderStatus(id, status);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Orders PUT Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 warning.' }, { status: 500 });
  }
}
