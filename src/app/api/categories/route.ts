import { NextResponse } from 'next/server';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/db';

export async function GET() {
  try {
    const data = await getCategories();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Categories GET Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, image } = body;

    if (!name || !image) {
      return NextResponse.json({ error: '카테고리 이름과 이미지 URL이 필요합니다.' }, { status: 400 });
    }

    const newCategory = await createCategory({ name, image });
    return NextResponse.json({ success: true, data: newCategory });
  } catch (error: any) {
    console.error('Categories POST Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, image } = body;

    if (!id || !name || !image) {
      return NextResponse.json({ error: '필수 필드(id, name, image)가 누락되었습니다.' }, { status: 400 });
    }

    const updated = await updateCategory(id, { name, image });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Categories PUT Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      // Fallback to body
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: '카테고리 ID가 필요합니다.' }, { status: 400 });
    }

    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Categories DELETE Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
