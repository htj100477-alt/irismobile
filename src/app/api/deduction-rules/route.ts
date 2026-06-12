import { NextResponse } from 'next/server';
import { 
  getDeductionRules, 
  createDeductionRule, 
  updateDeductionRule, 
  deleteDeductionRule 
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getDeductionRules();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API GET deduction-rules error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name_ko, name_zh, amount_hkd } = body;
    if (!name_ko || !name_zh || amount_hkd === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }
    const data = await createDeductionRule({ name_ko, name_zh, amount_hkd: Number(amount_hkd) });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API POST deduction-rules error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name_ko, name_zh, amount_hkd } = body;
    if (!id || !name_ko || !name_zh || amount_hkd === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }
    const data = await updateDeductionRule(id, { name_ko, name_zh, amount_hkd: Number(amount_hkd) });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API PUT deduction-rules error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }
    await deleteDeductionRule(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE deduction-rules error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
