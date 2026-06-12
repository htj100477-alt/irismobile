import { NextResponse } from 'next/server';
import { 
  getBulkSaleDeductions,
  createBulkSaleDeductionLog,
  updateBulkSaleDeductionLog,
  deleteBulkSaleDeductionLog
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getBulkSaleDeductions();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API GET bulk-sale-deductions error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      sale_date, 
      name_ko, 
      name_zh, 
      quantity, 
      amount_hkd, 
      total_hkd, 
      total_krw, 
      exchange_rate, 
      seller_name, 
      sold_summary 
    } = body;
    
    if (!sale_date || !name_ko || !name_zh || quantity === undefined || amount_hkd === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const data = await createBulkSaleDeductionLog({
      sale_date,
      name_ko,
      name_zh,
      quantity: Number(quantity),
      amount_hkd: Number(amount_hkd),
      total_hkd: Number(total_hkd),
      total_krw: Number(total_krw),
      exchange_rate: Number(exchange_rate),
      seller_name: seller_name || '',
      sold_summary: sold_summary || ''
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API POST bulk-sale-deductions error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name_ko, name_zh, quantity, amount_hkd, total_hkd, total_krw, exchange_rate, seller_name, sold_summary } = body;
    
    if (!id || !name_ko || !name_zh || quantity === undefined || amount_hkd === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const data = await updateBulkSaleDeductionLog(id, {
      name_ko,
      name_zh,
      quantity: Number(quantity),
      amount_hkd: Number(amount_hkd),
      total_hkd: Number(total_hkd),
      total_krw: Number(total_krw),
      exchange_rate: Number(exchange_rate),
      seller_name: seller_name || '',
      sold_summary: sold_summary || ''
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API PUT bulk-sale-deductions error:', error);
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

    await deleteBulkSaleDeductionLog(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE bulk-sale-deductions error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
