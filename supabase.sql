-- 트루 모바일 (True Mobile) Supabase 테이블 생성 SQL 스크립트

-- 1. 사용자 테이블 (members)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    pin_code VARCHAR(4) NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 활성화
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read/insert members for login/signup" ON public.members 
    FOR ALL USING (true) WITH CHECK (true);

-- 2. 매입 신청 테이블 (trade_in_requests)
CREATE TABLE IF NOT EXISTS public.trade_in_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    brand VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    storage VARCHAR(20) NOT NULL,
    color VARCHAR(50),
    condition_answers JSONB NOT NULL,
    estimated_price NUMERIC DEFAULT 0 NOT NULL,
    final_price NUMERIC,
    status VARCHAR(30) DEFAULT 'pending' NOT NULL,
    shipping_method VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    bank_name VARCHAR(50) NOT NULL,
    bank_account VARCHAR(100) NOT NULL,
    account_holder VARCHAR(50) NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.trade_in_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage trade_in_requests for simple demo" ON public.trade_in_requests 
    FOR ALL USING (true) WITH CHECK (true);

-- 3. 중고폰 판매 상품 테이블 (products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    storage VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    price NUMERIC NOT NULL,
    grade VARCHAR(10) NOT NULL,
    images TEXT[] NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'available' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products 
    FOR SELECT USING (true);
CREATE POLICY "Anyone can modify products for admin demo" ON public.products 
    FOR ALL USING (true) WITH CHECK (true);

-- 4. 중고폰 구매 주문 테이블 (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    price NUMERIC NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' NOT NULL,
    shipping_name VARCHAR(50) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage orders for demo" ON public.orders 
    FOR ALL USING (true) WITH CHECK (true);


-- 5. 기본 중고폰 상품 샘플 데이터 삽입
INSERT INTO public.products (brand, model_name, storage, color, price, grade, images, description, status)
VALUES 
('Apple', '아이폰 15 프로', '256GB', '내추럴 티타늄', 1150000, 'S', 
 ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60'], 
 '액정 및 외관 기스 전혀 없는 S급 상품입니다. 박스 포함 풀세트.', 'available'),

('Apple', '아이폰 14', '128GB', '스타라이트', 750000, 'A', 
 ARRAY['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60'], 
 '테두리에 미세한 생활 기스가 있으나 전체적으로 매우 깨끗합니다.', 'available'),

('Samsung', '갤럭시 S24 울트라', '512GB', '티타늄 블랙', 1250000, 'S', 
 ARRAY['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60'], 
 '개통 후 실사용 2주 미만의 거의 새 제품입니다. 최초 통화일 2024년 3월.', 'available'),

('Samsung', '갤럭시 S23', '256GB', '크림', 650000, 'B', 
 ARRAY['https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=500&auto=format&fit=crop&q=60'], 
 '뒷면에 카메라 옆 미세 기스 있으며 잔상 없는 가성비 좋은 B급 상품입니다.', 'available')
ON CONFLICT DO NOTHING;
