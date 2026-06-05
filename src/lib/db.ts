import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase 환경 변수 설정 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// 로컬 Mock DB 파일 경로 (서버사이드에서만 사용 가능)
const MOCK_DB_PATH = path.join(process.cwd(), 'src/lib/mock-db.json');

// 기본 샘플 상품 데이터
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    brand: 'Apple',
    model_name: '아이폰 15 프로',
    storage: '256GB',
    color: '내추럴 티타늄',
    price: 1150000,
    grade: 'S',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60'],
    description: '액정 및 외관 기스 전혀 없는 S급 상품입니다. 박스 포함 풀세트.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-2',
    brand: 'Apple',
    model_name: '아이폰 14',
    storage: '128GB',
    color: '스타라이트',
    price: 750000,
    grade: 'A',
    images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60'],
    description: '테두리에 미세한 생활 기스가 있으나 전체적으로 매우 깨끗합니다.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-3',
    brand: 'Samsung',
    model_name: '갤럭시 S24 울트라',
    storage: '512GB',
    color: '티타늄 블랙',
    price: 1250000,
    grade: 'S',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60'],
    description: '개통 후 실사용 2주 미만의 거의 새 제품입니다. 최초 통화일 2024년 3월.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-4',
    brand: 'Samsung',
    model_name: '갤럭시 S23',
    storage: '256GB',
    color: '크림',
    price: 650000,
    grade: 'B',
    images: ['https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=500&auto=format&fit=crop&q=60'],
    description: '뒷면에 카메라 옆 미세 기스 있으며 잔상 없는 가성비 좋은 B급 상품입니다.',
    status: 'available',
    created_at: new Date().toISOString()
  }
];

// 기본 샘플 매입 신청서 데이터
const DEFAULT_TRADE_INS = [
  {
    id: 'trade-1',
    member_id: 'member-test',
    brand: 'Apple',
    model_name: '아이폰 13 프로',
    storage: '128GB',
    color: '시이에라 블루',
    condition_answers: {
      screen: 'scratch', // 미세흠집
      body: 'clean', // 깨끗함
      camera: 'good', // 정상
      screen_burn: 'none' // 잔상없음
    },
    estimated_price: 520000,
    final_price: 500000,
    status: 'inspecting', // 검수중
    shipping_method: 'parcel', // 택배
    shipping_address: '서울시 강남구 테헤란로 123, 405호',
    bank_name: '국민은행',
    bank_account: '123-45-6789-012',
    account_holder: '홍길동',
    admin_notes: '카메라 주변 테두리에 미세 기스 확인되어 2만원 최종 차감 조정함.',
    created_at: new Date().toISOString()
  }
];

// 기본 테스트 회원 데이터
const DEFAULT_MEMBERS = [
  {
    id: 'member-test',
    phone_number: '01012345678',
    pin_code: '1234',
    name: '홍길동',
    created_at: new Date().toISOString()
  }
];

// Mock DB 구조 인터페이스
interface MockDB {
  members: any[];
  trade_ins: any[];
  products: any[];
  orders: any[];
}

// Mock DB 초기화 및 로드 함수
function readMockDB(): MockDB {
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      const initialDB: MockDB = {
        members: DEFAULT_MEMBERS,
        trade_ins: DEFAULT_TRADE_INS,
        products: DEFAULT_PRODUCTS,
        orders: []
      };
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(initialDB, null, 2), 'utf-8');
      return initialDB;
    }
    const fileContent = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Mock DB Read Error: ", error);
    return { members: [], trade_ins: [], products: [], orders: [] };
  }
}

// Mock DB 쓰기 함수
function writeMockDB(data: MockDB) {
  try {
    // 디렉토리가 존재하는지 확인
    const dir = path.dirname(MOCK_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Mock DB Write Error: ", error);
  }
}

// ==========================================
// 1. 회원 (Members) 데이터 액션
// ==========================================
export async function getMemberByPhone(phone: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (supabase) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('phone_number', cleanPhone)
      .maybeSingle();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return db.members.find(m => m.phone_number === cleanPhone) || null;
  }
}

export async function createMember(phone: string, pin: string, name: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (supabase) {
    const { data, error } = await supabase
      .from('members')
      .insert([{ phone_number: cleanPhone, pin_code: pin, name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    const newMember = {
      id: `member-${Date.now()}`,
      phone_number: cleanPhone,
      pin_code: pin,
      name,
      created_at: new Date().toISOString()
    };
    db.members.push(newMember);
    writeMockDB(db);
    return newMember;
  }
}

// ==========================================
// 2. 매입 신청 (Trade-in Requests) 데이터 액션
// ==========================================
export async function createTradeInRequest(requestData: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from('trade_in_requests')
      .insert([requestData])
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    const newRequest = {
      id: `trade-${Date.now()}`,
      ...requestData,
      created_at: new Date().toISOString()
    };
    db.trade_ins.push(newRequest);
    writeMockDB(db);
    return newRequest;
  }
}

export async function getTradeInRequests() {
  if (supabase) {
    const { data, error } = await supabase
      .from('trade_in_requests')
      .select('*, members(name, phone_number)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return [...db.trade_ins]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(t => {
        const member = db.members.find(m => m.id === t.member_id);
        return {
          ...t,
          members: member ? { name: member.name, phone_number: member.phone_number } : null
        };
      });
  }
}

export async function getTradeInRequestsByMember(memberId: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('trade_in_requests')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return db.trade_ins
      .filter(t => t.member_id === memberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function updateTradeInStatusAndPrice(id: string, status: string, finalPrice?: number | null, adminNotes?: string) {
  if (supabase) {
    const updatePayload: any = { status };
    if (finalPrice !== undefined) updatePayload.final_price = finalPrice;
    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;

    const { data, error } = await supabase
      .from('trade_in_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    const index = db.trade_ins.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Trade-in request not found");
    
    db.trade_ins[index].status = status;
    if (finalPrice !== undefined) db.trade_ins[index].final_price = finalPrice;
    if (adminNotes !== undefined) db.trade_ins[index].admin_notes = adminNotes;
    
    writeMockDB(db);
    return db.trade_ins[index];
  }
}

// ==========================================
// 3. 상품 (Products) 데이터 액션
// ==========================================
export async function getProducts() {
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return [...db.products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function getProductById(id: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return db.products.find(p => p.id === id) || null;
  }
}

export async function createProduct(productData: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    const newProduct = {
      id: `prod-${Date.now()}`,
      ...productData,
      created_at: new Date().toISOString()
    };
    db.products.push(newProduct);
    writeMockDB(db);
    return newProduct;
  }
}

export async function updateProduct(id: string, productData: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    
    db.products[index] = {
      ...db.products[index],
      ...productData
    };
    writeMockDB(db);
    return db.products[index];
  }
}

export async function deleteProduct(id: string) {
  if (supabase) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDB();
    const filtered = db.products.filter(p => p.id !== id);
    if (filtered.length === db.products.length) throw new Error("Product not found");
    db.products = filtered;
    writeMockDB(db);
    return true;
  }
}

// ==========================================
// 4. 주문 (Orders) 데이터 액션
// ==========================================
export async function createOrder(orderData: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    if (error) throw error;
    
    // 주문된 상품의 상태를 판매완료(sold)로 변경
    await supabase
      .from('products')
      .update({ status: 'sold' })
      .eq('id', orderData.product_id);

    return data;
  } else {
    const db = readMockDB();
    const newOrder = {
      id: `order-${Date.now()}`,
      ...orderData,
      created_at: new Date().toISOString()
    };
    db.orders.push(newOrder);
    
    // 상품 상태 sold 처리
    const prodIdx = db.products.findIndex(p => p.id === orderData.product_id);
    if (prodIdx !== -1) {
      db.products[prodIdx].status = 'sold';
    }
    
    writeMockDB(db);
    return newOrder;
  }
}

export async function getOrders() {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, members(name, phone_number), products(brand, model_name, storage, color, grade)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return [...db.orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(o => {
        const member = db.members.find(m => m.id === o.member_id);
        const product = db.products.find(p => p.id === o.product_id);
        return {
          ...o,
          members: member ? { name: member.name, phone_number: member.phone_number } : null,
          products: product || null
        };
      });
  }
}

export async function getOrdersByMember(memberId: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, products(brand, model_name, storage, color, grade, images)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return db.orders
      .filter(o => o.member_id === memberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(o => {
        const product = db.products.find(p => p.id === o.product_id);
        return {
          ...o,
          products: product || null
        };
      });
  }
}

export async function updateOrderStatus(id: string, status: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    const index = db.orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error("Order not found");
    
    db.orders[index].status = status;
    writeMockDB(db);
    return db.orders[index];
  }
}
