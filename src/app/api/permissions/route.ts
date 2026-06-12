import { NextResponse } from 'next/server';
import { getMenuPermissions, saveMenuPermissions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getMenuPermissions();
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('GET Permissions Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { role, permissions } = body;
    
    if (!role || !permissions) {
      return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
    }

    const data = await saveMenuPermissions(role, permissions);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('PUT Permissions Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}
