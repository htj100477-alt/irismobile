import { NextResponse } from 'next/server';
import { getTradeInPrices, createTradeInPrice, updateTradeInPrice } from '@/lib/db';

export async function GET() {
  try {
    const data = await getTradeInPrices();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Trade-in Prices GET Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      brand,
      model_name,
      base_price,
      storage_128g_deduct,
      storage_512g_add,
      screen_scratch_deduct,
      screen_broken_deduct,
      body_scratch_deduct,
      body_broken_deduct,
      camera_error_deduct,
      screen_burn_deduct,
      category,
      series
    } = body;

    if (!brand || !model_name) {
      return NextResponse.json({ error: '브랜드와 기종명은 필수 입력 정보입니다.' }, { status: 400 });
    }

    const newPrice = await createTradeInPrice({
      brand,
      model_name,
      base_price: Number(base_price || 0),
      storage_128g_deduct: Number(storage_128g_deduct || 0),
      storage_512g_add: Number(storage_512g_add || 0),
      screen_scratch_deduct: Number(screen_scratch_deduct || 0),
      screen_broken_deduct: Number(screen_broken_deduct || 0),
      body_scratch_deduct: Number(body_scratch_deduct || 0),
      body_broken_deduct: Number(body_broken_deduct || 0),
      camera_error_deduct: Number(camera_error_deduct || 0),
      screen_burn_deduct: Number(screen_burn_deduct || 0),
      category: category || '스마트폰',
      series: series || '기타 시리즈'
    });

    return NextResponse.json({ success: true, data: newPrice });
  } catch (error: any) {
    console.error('Trade-in Prices POST Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: '시세 설정 ID가 누락되었습니다.' }, { status: 400 });
    }

    // Number conversion for numeric fields
    const numericFields = [
      'base_price',
      'storage_128g_deduct',
      'storage_512g_add',
      'screen_scratch_deduct',
      'screen_broken_deduct',
      'body_scratch_deduct',
      'body_broken_deduct',
      'camera_error_deduct',
      'screen_burn_deduct'
    ];

    for (const field of numericFields) {
      if (updateData[field] !== undefined) {
        updateData[field] = Number(updateData[field]);
      }
    }

    const updated = await updateTradeInPrice(id, updateData);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Trade-in Prices PUT Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
