import { NextResponse } from 'next/server';
import { getModelPetNames, saveModelPetName, deleteModelPetName } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getModelPetNames();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API GET model-pet-names error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelCode, petNameKo, petNameZh } = body;
    if (!modelCode || !petNameKo || !petNameZh) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }
    const data = await saveModelPetName(modelCode, petNameKo, petNameZh);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API POST model-pet-names error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelCode = searchParams.get('modelCode');
    if (!modelCode) {
      return NextResponse.json({ success: false, error: 'Missing modelCode parameter' }, { status: 400 });
    }
    await deleteModelPetName(modelCode);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE model-pet-names error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
