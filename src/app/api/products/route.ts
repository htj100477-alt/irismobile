import { NextResponse } from 'next/server';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/db';

export async function GET() {
  try {
    const data = await getProducts();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Products GET Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand, model_name, storage, color, price, grade, images, description, status, category, series, battery_efficiency, carrier_info } = body;

    if (!brand || !model_name || !storage || !color || !price || !grade) {
      return NextResponse.json({ error: '필수 상품 정보가 누락되었습니다.' }, { status: 400 });
    }

    const newProduct = await createProduct({
      brand,
      model_name,
      storage,
      color,
      price: Number(price),
      grade,
      images: images || [],
      description: description || '',
      status: status || 'available',
      category: category || '스마트폰',
      series: series || '기타 시리즈',
      battery_efficiency: battery_efficiency || '',
      carrier_info: carrier_info || ''
    });

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    console.error('Products POST Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: '상품 ID가 누락되었습니다.' }, { status: 400 });
    }

    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }

    const updated = await updateProduct(id, updateData);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Products PUT Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '삭제할 상품 ID가 누락되었습니다.' }, { status: 400 });
    }

    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Products DELETE Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
