import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://api.stock.naver.com/marketindex/exchange/FX_CNYKRW', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    if (!res.ok) {
      throw new Error(`Naver Stock API returned status ${res.status}`);
    }
    
    const data = await res.json();
    const rate = Number(data?.exchangeInfo?.closePrice) || 185.0; // fallback to 185.0 if parsing fails
    return NextResponse.json({ success: true, rate });
  } catch (error: any) {
    console.error('Failed to fetch Naver CNY exchange rate:', error);
    // Return a default rate rather than crashing the client dashboard
    return NextResponse.json({ success: true, rate: 185.0, error: error.message });
  }
}
