import { NextResponse } from 'next/server';
import { 
  getHongKongInventory, 
  importHongKongInventory, 
  processHongKongBulkSale, 
  approveHongKongSales,
  cancelHongKongSales,
  deleteHongKongInventory 
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getHongKongInventory();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API GET hongkong-inventory error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records } = body;
    if (!Array.isArray(records)) {
      return NextResponse.json({ success: false, error: 'Invalid records format' }, { status: 400 });
    }
    const data = await importHongKongInventory(records);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API POST hongkong-inventory error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'sell') {
      const { saleDate, sellerName, sellingPrice, soldIds, remainingIdentifiers } = body;
      if (!saleDate || !sellerName || !Array.isArray(soldIds) || !Array.isArray(remainingIdentifiers)) {
        return NextResponse.json({ success: false, error: 'Missing required sell fields' }, { status: 400 });
      }
      const sPrice = Number(sellingPrice) || 0;
      const result = await processHongKongBulkSale(saleDate, sellerName, sPrice, soldIds, remainingIdentifiers);
      return NextResponse.json({ success: true, count: result.count });
    } 
    
    if (action === 'approve') {
      const { deviceIds } = body;
      if (!Array.isArray(deviceIds)) {
        return NextResponse.json({ success: false, error: 'Missing deviceIds for approval' }, { status: 400 });
      }
      await approveHongKongSales(deviceIds);
      return NextResponse.json({ success: true });
    }

    if (action === 'cancel_sale') {
      const { deviceIds } = body;
      if (!Array.isArray(deviceIds)) {
        return NextResponse.json({ success: false, error: 'Missing deviceIds for cancellation' }, { status: 400 });
      }
      await cancelHongKongSales(deviceIds);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API PUT hongkong-inventory error:', error);
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
    await deleteHongKongInventory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE hongkong-inventory error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
