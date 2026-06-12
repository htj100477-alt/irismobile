import { NextResponse } from 'next/server';
import { getMembers, updateMember, deleteMember } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getMembers();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('GET Members Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, pin_code, role, address_province, address_city, address_detail } = body;
    
    if (!id) {
      return NextResponse.json({ error: '회원 ID가 누락되었습니다.' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (pin_code !== undefined) updateData.pin_code = pin_code;
    if (role !== undefined) updateData.role = role;
    if (address_province !== undefined) updateData.address_province = address_province;
    if (address_city !== undefined) updateData.address_city = address_city;
    if (address_detail !== undefined) updateData.address_detail = address_detail;

    const member = await updateMember(id, updateData);
    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    console.error('PUT Member Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '회원 ID가 누락되었습니다.' }, { status: 400 });
    }

    await deleteMember(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE Member Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}
