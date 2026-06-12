import { NextResponse } from 'next/server';
import { getMemberByPhone, createMember } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone_number, pin_code, name } = body;

    if (!phone_number) {
      return NextResponse.json({ error: '휴대폰 번호가 누락되었습니다.' }, { status: 400 });
    }

    const cleanPhone = phone_number.replace(/[^0-9]/g, '');

    // 1. 가입 여부 확인 (휴대폰 번호만 검사)
    if (action === 'check_phone') {
      const member = await getMemberByPhone(cleanPhone);
      if (member) {
        return NextResponse.json({ exists: true, name: member.name });
      } else {
        return NextResponse.json({ exists: false });
      }
    }

    // 1.5. 최신 프로필 정보 동기화
    if (action === 'get_profile') {
      const member = await getMemberByPhone(cleanPhone);
      if (member) {
        return NextResponse.json({ success: true, member });
      } else {
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    // 2. 회원가입
    if (action === 'register') {
      if (!pin_code || !name) {
        return NextResponse.json({ error: '이름과 4자리 PIN 코드가 필요합니다.' }, { status: 400 });
      }
      
      const existing = await getMemberByPhone(cleanPhone);
      if (existing) {
        return NextResponse.json({ error: '이미 가입된 휴대폰 번호입니다.' }, { status: 400 });
      }

      const member = await createMember(cleanPhone, pin_code, name);
      return NextResponse.json({ success: true, member });
    }

    // 3. 로그인
    if (action === 'login') {
      if (!pin_code) {
        return NextResponse.json({ error: 'PIN 코드가 필요합니다.' }, { status: 400 });
      }

      const member = await getMemberByPhone(cleanPhone);
      if (!member) {
        return NextResponse.json({ error: '가입되지 않은 휴대폰 번호입니다.' }, { status: 404 });
      }

      if (member.pin_code !== pin_code) {
        return NextResponse.json({ error: 'PIN 번호가 일치하지 않습니다.' }, { status: 401 });
      }

      return NextResponse.json({ success: true, member });
    }

    return NextResponse.json({ error: '잘못된 작업(action)입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
