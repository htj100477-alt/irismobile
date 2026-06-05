import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base64Data, fileName } = body;

    if (!base64Data) {
      return NextResponse.json({ error: '이미지 데이터가 없습니다.' }, { status: 400 });
    }

    // 1. Supabase가 연결되어 있는 경우
    if (supabase) {
      try {
        // Base64 to buffer conversion
        const base64Image = base64Data.split(';base64,').pop();
        if (!base64Image) {
          return NextResponse.json({ error: '올바르지 않은 이미지 형식입니다.' }, { status: 400 });
        }
        
        const buffer = Buffer.from(base64Image, 'base64');
        const contentType = base64Data.split(';base64,')[0].split('data:')[1] || 'image/jpeg';

        // Unique filename
        const cleanFileName = fileName ? fileName.replace(/[^a-zA-Z0-9.]/g, '_') : `img_${Date.now()}.jpg`;
        const uniquePath = `${Date.now()}_${cleanFileName}`;

        // Upload to 'product-images' bucket
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(uniquePath, buffer, {
            contentType,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.warn('Supabase storage upload failed, falling back to base64:', error);
          // 버킷이 없거나 정책 에러 시 Base64로 폴백하여 등록은 되도록 보장
          return NextResponse.json({ success: true, url: base64Data });
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(uniquePath);

        return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
      } catch (err) {
        console.error('Supabase storage upload error:', err);
        return NextResponse.json({ success: true, url: base64Data });
      }
    }

    // 2. Supabase가 연결되어 있지 않은 경우 (Mock DB)
    // Base64 데이터를 그대로 반환하여 데이터베이스에 저장되게 함
    return NextResponse.json({ success: true, url: base64Data });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || '업로드 중 오류 발생' }, { status: 500 });
  }
}
