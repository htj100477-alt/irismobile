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

// 기본 샘플 카테고리 데이터
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: '스마트폰', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150' },
  { id: 'cat-2', name: '태블릿', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=150' },
  { id: 'cat-3', name: '스마트워치', image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=150' },
  { id: 'cat-4', name: '노트북', image: 'https://images.unsplash.com/photo-1496181130204-7552cc14b1b0?w=150' },
  { id: 'cat-5', name: '무선이어폰', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150' }
];

// 기본 샘플 상품 데이터
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    brand: 'Apple',
    model_name: '아이폰 15 프로',
    category: '스마트폰',
    series: '15 시리즈',
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
    category: '스마트폰',
    series: '14 시리즈',
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
    category: '스마트폰',
    series: 'S24 시리즈',
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
    category: '스마트폰',
    series: 'S23 시리즈',
    storage: '256GB',
    color: '크림',
    price: 650000,
    grade: 'B',
    images: ['https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=500&auto=format&fit=crop&q=60'],
    description: '뒷면에 카메라 옆 미세 기스 있으며 잔상 없는 가성비 좋은 B급 상품입니다.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-5',
    brand: 'Apple',
    model_name: 'M3 맥북 에어 13',
    category: '노트북',
    series: '맥북 시리즈',
    storage: '256GB',
    color: '스페이스 그레이',
    price: 1350000,
    grade: 'S',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60'],
    description: '박스 및 순정 충전기 포함 풀세트이며, 배터리 효율 100% S급 상태입니다.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-6',
    brand: 'Apple',
    model_name: '아이패드 에어 6세대',
    category: '태블릿',
    series: '아이패드 시리즈',
    storage: '128GB',
    color: '스페이스 그레이',
    price: 780000,
    grade: 'S',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60'],
    description: '실사용 거의 없는 신품급 태블릿 PC입니다. 필름 부착되어 있습니다.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-7',
    brand: 'Apple',
    model_name: '애플워치 9 45mm',
    category: '스마트워치',
    series: '애플워치 시리즈',
    storage: '32GB',
    color: '미드나잇',
    price: 380000,
    grade: 'A',
    images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=60'],
    description: '테두리 미세한 생활 흠집 존재하나 전체 작동 이상 무.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-8',
    brand: 'Apple',
    model_name: '에어팟 프로 2세대',
    category: '무선이어폰',
    series: '에어팟 시리즈',
    storage: '기본형',
    color: '화이트',
    price: 220000,
    grade: 'S',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60'],
    description: '케이스 스킨스티커 미사용이며 상태 최상입니다. 철가루 방지 스티커 적용됨.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-9',
    brand: 'Samsung',
    model_name: '갤럭시 북 4 프로',
    category: '노트북',
    series: '갤럭시북 시리즈',
    storage: '512GB',
    color: '문스톤 그레이',
    price: 1450000,
    grade: 'S',
    images: ['https://images.unsplash.com/photo-1496181130204-7552cc14b1b0?w=500&auto=format&fit=crop&q=60'],
    description: '고사양 노트북이며 상태 S급입니다. 가죽 파우치 증정합니다.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-10',
    brand: 'Samsung',
    model_name: '갤럭시 탭 S9',
    category: '태블릿',
    series: '갤럭시탭 시리즈',
    storage: '256GB',
    color: '그라파이트',
    price: 680000,
    grade: 'A',
    images: ['https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=500&auto=format&fit=crop&q=60'],
    description: '펜 포함이며 기능 정상 동작합니다. 액정 보호 필름 부착됨.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-11',
    brand: 'Samsung',
    model_name: '갤럭시 워치 6 44mm',
    category: '스마트워치',
    series: '갤럭시워치 시리즈',
    storage: '16GB',
    color: '실버',
    price: 210000,
    grade: 'B',
    images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=60'],
    description: '생활 스크래치가 다소 있는 실사용에 편한 B급 상품입니다.',
    status: 'available',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-12',
    brand: 'Samsung',
    model_name: '갤럭시 버즈 2 프로',
    category: '무선이어폰',
    series: '갤럭시버즈 시리즈',
    storage: '기본형',
    color: '그라파이트',
    price: 110000,
    grade: 'A',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60'],
    description: '양쪽 유닛 정상 동작하며 외관 미세한 흠집 있습니다.',
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
    category: '스마트폰',
    series: '13 시리즈',
    model_name: '아이폰 13 프로',
    storage: '128GB',
    color: '시이에라 블루',
    condition_answers: {
      screen: 'scratch',
      body: 'clean',
      camera: 'good',
      screen_burn: 'none'
    },
    estimated_price: 520000,
    final_price: 500000,
    status: 'inspecting',
    shipping_method: 'parcel',
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

// 기본 매입 기준 시세표 데이터
const DEFAULT_PRICES = [
  { id: 'price-1', brand: 'Apple', category: '스마트폰', series: '15 시리즈', model_name: '아이폰 15 프로', base_price: 1150000, storage_128g_deduct: 80000, storage_512g_add: 120000, screen_scratch_deduct: 70000, screen_broken_deduct: 250000, body_scratch_deduct: 40000, body_broken_deduct: 120000, camera_error_deduct: 100000, screen_burn_deduct: 80000, updated_at: new Date().toISOString() },
  { id: 'price-2', brand: 'Apple', category: '스마트폰', series: '15 시리즈', model_name: '아이폰 15', base_price: 750000, storage_128g_deduct: 80000, storage_512g_add: 120000, screen_scratch_deduct: 70000, screen_broken_deduct: 250000, body_scratch_deduct: 40000, body_broken_deduct: 120000, camera_error_deduct: 100000, screen_burn_deduct: 80000, updated_at: new Date().toISOString() },
  { id: 'price-3', brand: 'Apple', category: '스마트폰', series: '14 시리즈', model_name: '아이폰 14 프로', base_price: 850000, storage_128g_deduct: 80000, storage_512g_add: 120000, screen_scratch_deduct: 70000, screen_broken_deduct: 250000, body_scratch_deduct: 40000, body_broken_deduct: 120000, camera_error_deduct: 100000, screen_burn_deduct: 80000, updated_at: new Date().toISOString() },
  { id: 'price-4', brand: 'Apple', category: '스마트폰', series: '13 시리즈', model_name: '아이폰 13 프로', base_price: 580000, storage_128g_deduct: 80000, storage_512g_add: 120000, screen_scratch_deduct: 70000, screen_broken_deduct: 250000, body_scratch_deduct: 40000, body_broken_deduct: 120000, camera_error_deduct: 100000, screen_burn_deduct: 80000, updated_at: new Date().toISOString() },
  { id: 'price-5', brand: 'Apple', category: '스마트폰', series: '13 시리즈', model_name: '아이폰 13', base_price: 420000, storage_128g_deduct: 80000, storage_512g_add: 120000, screen_scratch_deduct: 70000, screen_broken_deduct: 250000, body_scratch_deduct: 40000, body_broken_deduct: 120000, camera_error_deduct: 100000, screen_burn_deduct: 80000, updated_at: new Date().toISOString() },
  { id: 'price-6', brand: 'Samsung', category: '스마트폰', series: 'S24 시리즈', model_name: '갤럭시 S24 울트라', base_price: 1200000, storage_128g_deduct: 80000, storage_512g_add: 120000, screen_scratch_deduct: 70000, screen_broken_deduct: 250000, body_scratch_deduct: 40000, body_broken_deduct: 120000, camera_error_deduct: 100000, screen_burn_deduct: 80000, updated_at: new Date().toISOString() },
  { id: 'price-7', brand: 'Samsung', category: '스마트폰', series: 'S24 시리즈', model_name: '갤럭시 S24', base_price: 720000, storage_128g_deduct: 80000, storage_512g_add: 120000, screen_scratch_deduct: 70000, screen_broken_deduct: 250000, body_scratch_deduct: 40000, body_broken_deduct: 120000, camera_error_deduct: 100000, screen_burn_deduct: 80000, updated_at: new Date().toISOString() },
  { id: 'price-8', brand: 'Samsung', category: '스마트폰', series: 'S23 시리즈', model_name: '갤럭시 S23 울트라', base_price: 780000, storage_128g_deduct: 80000, storage_512g_add: 120000, screen_scratch_deduct: 70000, screen_broken_deduct: 250000, body_scratch_deduct: 40000, body_broken_deduct: 120000, camera_error_deduct: 100000, screen_burn_deduct: 80000, updated_at: new Date().toISOString() },
  { id: 'price-9', brand: 'Samsung', category: '스마트폰', series: 'Z 시리즈', model_name: '갤럭시 Z 플립 5', base_price: 620000, storage_128g_deduct: 80000, storage_512g_add: 120000, screen_scratch_deduct: 70000, screen_broken_deduct: 250000, body_scratch_deduct: 40000, body_broken_deduct: 120000, camera_error_deduct: 100000, screen_burn_deduct: 80000, updated_at: new Date().toISOString() },
  { id: 'price-10', brand: 'Apple', category: '노트북', series: '맥북 시리즈', model_name: 'M3 맥북 에어 13', base_price: 1350000, storage_128g_deduct: 100000, storage_512g_add: 180000, screen_scratch_deduct: 80000, screen_broken_deduct: 350000, body_scratch_deduct: 50000, body_broken_deduct: 150000, camera_error_deduct: 80000, screen_burn_deduct: 50000, updated_at: new Date().toISOString() },
  { id: 'price-11', brand: 'Apple', category: '태블릿', series: '아이패드 시리즈', model_name: '아이패드 에어 6세대', base_price: 780000, storage_128g_deduct: 60000, storage_512g_add: 100000, screen_scratch_deduct: 60000, screen_broken_deduct: 200000, body_scratch_deduct: 30000, body_broken_deduct: 100000, camera_error_deduct: 50000, screen_burn_deduct: 60000, updated_at: new Date().toISOString() },
  { id: 'price-12', brand: 'Apple', category: '스마트워치', series: '애플워치 시리즈', model_name: '애플워치 9 45mm', base_price: 380000, storage_128g_deduct: 30000, storage_512g_add: 50000, screen_scratch_deduct: 40000, screen_broken_deduct: 120000, body_scratch_deduct: 20000, body_broken_deduct: 60000, camera_error_deduct: 30000, screen_burn_deduct: 30000, updated_at: new Date().toISOString() },
  { id: 'price-13', brand: 'Apple', category: '무선이어폰', series: '에어팟 시리즈', model_name: '에어팟 프로 2세대', base_price: 220000, storage_128g_deduct: 20000, storage_512g_add: 30000, screen_scratch_deduct: 20000, screen_broken_deduct: 60000, body_scratch_deduct: 10000, body_broken_deduct: 30000, camera_error_deduct: 20000, screen_burn_deduct: 10000, updated_at: new Date().toISOString() },
  { id: 'price-14', brand: 'Samsung', category: '노트북', series: '갤럭시북 시리즈', model_name: '갤럭시 북 4 프로', base_price: 1450000, storage_128g_deduct: 120000, storage_512g_add: 200000, screen_scratch_deduct: 90000, screen_broken_deduct: 400000, body_scratch_deduct: 60000, body_broken_deduct: 180000, camera_error_deduct: 100000, screen_burn_deduct: 60000, updated_at: new Date().toISOString() },
  { id: 'price-15', brand: 'Samsung', category: '태블릿', series: '갤럭시탭 시리즈', model_name: '갤럭시 탭 S9', base_price: 680000, storage_128g_deduct: 50000, storage_512g_add: 80000, screen_scratch_deduct: 50000, screen_broken_deduct: 180000, body_scratch_deduct: 25000, body_broken_deduct: 90000, camera_error_deduct: 40000, screen_burn_deduct: 50000, updated_at: new Date().toISOString() },
  { id: 'price-16', brand: 'Samsung', category: '스마트워치', series: '갤럭시워치 시리즈', model_name: '갤럭시 워치 6 44mm', base_price: 210000, storage_128g_deduct: 20000, storage_512g_add: 30000, screen_scratch_deduct: 30000, screen_broken_deduct: 90000, body_scratch_deduct: 15000, body_broken_deduct: 45000, camera_error_deduct: 20000, screen_burn_deduct: 20000, updated_at: new Date().toISOString() },
  { id: 'price-17', brand: 'Samsung', category: '무선이어폰', series: '갤럭시버즈 시리즈', model_name: '갤럭시 버즈 2 프로', base_price: 110000, storage_128g_deduct: 10000, storage_512g_add: 20000, screen_scratch_deduct: 15000, screen_broken_deduct: 40000, body_scratch_deduct: 10000, body_broken_deduct: 20000, camera_error_deduct: 10000, screen_burn_deduct: 10000, updated_at: new Date().toISOString() }
];

// 기본 기종별 한글/중국어 펫네임 매핑 데이터
const DEFAULT_MODEL_PET_NAMES = [
  { model_code: 'SM-F916N', pet_name_ko: '갤럭시 Z폴드2', pet_name_zh: '三星 Z Fold2' },
  { model_code: 'SM-F926', pet_name_ko: '갤럭시 Z폴드3', pet_name_zh: '三星 Z Fold3' },
  { model_code: 'SM-F936', pet_name_ko: '갤럭시 Z폴드4', pet_name_zh: '三星 Z Fold4' },
  { model_code: 'SM-F946', pet_name_ko: '갤럭시 Z폴드5', pet_name_zh: '三星 Z Fold5' },
  { model_code: 'SM-F956', pet_name_ko: '갤럭시 Z폴드6', pet_name_zh: '三星 Z Fold6' },
  { model_code: 'SM-F700N', pet_name_ko: '갤럭시 Z플립', pet_name_zh: '三星 Z Flip' },
  { model_code: 'SM-F711N', pet_name_ko: '갤럭시 Z플립3', pet_name_zh: '三星 Z Flip3' },
  { model_code: 'SM-F721N', pet_name_ko: '갤럭시 Z플립4', pet_name_zh: '三星 Z Flip4' },
  { model_code: 'SM-F731N', pet_name_ko: '갤럭시 Z플립5', pet_name_zh: '三星 Z Flip5' },
  { model_code: 'SM-F741N', pet_name_ko: '갤럭시 Z플립6', pet_name_zh: '三星 Z Flip6' },
  { model_code: 'SM-S928N', pet_name_ko: '갤럭시 S24 울트라', pet_name_zh: '三星 S24 Ultra' },
  { model_code: 'SM-S918N', pet_name_ko: '갤럭시 S23 울트라', pet_name_zh: '三星 S23 Ultra' }
];

// Mock DB 구조 인터페이스
interface MockDB {
  members: any[];
  trade_ins: any[];
  products: any[];
  orders: any[];
  trade_in_prices: any[];
  categories?: any[];
  hongkong_inventory?: any[];
  model_pet_names?: any[];
}

// Mock DB 초기화 및 로드 함수
function readMockDB(): MockDB {
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      const initialDB: MockDB = {
        members: DEFAULT_MEMBERS,
        trade_ins: DEFAULT_TRADE_INS,
        products: DEFAULT_PRODUCTS,
        orders: [],
        trade_in_prices: DEFAULT_PRICES,
        categories: DEFAULT_CATEGORIES,
        hongkong_inventory: [],
        model_pet_names: DEFAULT_MODEL_PET_NAMES
      };
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(initialDB, null, 2), 'utf-8');
      return initialDB;
    }
    const fileContent = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    
    // 호환성을 위한 키 체크 및 자동 복구
    if (!parsed.trade_in_prices) {
      parsed.trade_in_prices = DEFAULT_PRICES;
      writeMockDB(parsed);
    }
    if (!parsed.categories) {
      parsed.categories = DEFAULT_CATEGORIES;
      writeMockDB(parsed);
    }
    if (!parsed.hongkong_inventory) {
      parsed.hongkong_inventory = [];
      writeMockDB(parsed);
    }
    if (!parsed.model_pet_names) {
      parsed.model_pet_names = DEFAULT_MODEL_PET_NAMES;
      writeMockDB(parsed);
    }
    return parsed;
  } catch (error) {
    console.error("Mock DB Read Error: ", error);
    return { members: [], trade_ins: [], products: [], orders: [], trade_in_prices: [], categories: [], hongkong_inventory: [], model_pet_names: [] };
  }
}

// Mock DB 쓰기 함수
function writeMockDB(data: MockDB) {
  try {
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

// ==========================================
// 5. 매입 기준 시세 (trade_in_prices) 데이터 액션
// ==========================================
export async function getTradeInPrices() {
  if (supabase) {
    const { data, error } = await supabase
      .from('trade_in_prices')
      .select('*')
      .order('brand', { ascending: true })
      .order('model_name', { ascending: true });
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return [...db.trade_in_prices]
      .sort((a, b) => {
        if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
        return a.model_name.localeCompare(b.model_name);
      });
  }
}

export async function createTradeInPrice(priceData: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from('trade_in_prices')
      .insert([priceData])
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    const newPrice = {
      id: `price-${Date.now()}`,
      ...priceData,
      updated_at: new Date().toISOString()
    };
    db.trade_in_prices.push(newPrice);
    writeMockDB(db);
    return newPrice;
  }
}

export async function updateTradeInPrice(id: string, priceData: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from('trade_in_prices')
      .update({ ...priceData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    const index = db.trade_in_prices.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Pricing rule not found");

    db.trade_in_prices[index] = {
      ...db.trade_in_prices[index],
      ...priceData,
      updated_at: new Date().toISOString()
    };
    writeMockDB(db);
    return db.trade_in_prices[index];
  }
}

// ==========================================
// 6. 카테고리 (Categories) 데이터 액션
// ==========================================
export async function getCategories() {
  if (supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return db.categories || [];
  }
}

export async function createCategory(catData: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from('categories')
      .insert([catData])
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    const newCat = {
      id: `cat-${Date.now()}`,
      ...catData,
      created_at: new Date().toISOString()
    };
    if (!db.categories) db.categories = [];
    db.categories.push(newCat);
    writeMockDB(db);
    return newCat;
  }
}

export async function updateCategory(id: string, catData: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from('categories')
      .update(catData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    if (!db.categories) db.categories = [];
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Category not found");
    db.categories[index] = {
      ...db.categories[index],
      ...catData
    };
    writeMockDB(db);
    return db.categories[index];
  }
}

export async function deleteCategory(id: string) {
  if (supabase) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDB();
    if (!db.categories) db.categories = [];
    const filtered = db.categories.filter(c => c.id !== id);
    db.categories = filtered;
    writeMockDB(db);
    return true;
  }
}

// ==========================================
// 7. 홍콩 재고 관리 (Hong Kong Inventory) 데이터 액션
// ==========================================
export async function getHongKongInventory() {
  if (supabase) {
    let allData: any[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('hongkong_inventory')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (error) throw error;
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = [...allData, ...data];
        if (data.length < limit) {
          hasMore = false;
        } else {
          from += limit;
        }
      }
    }
    return allData;
  } else {
    const db = readMockDB();
    const inv = db.hongkong_inventory || [];
    return [...inv].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }
}

export async function importHongKongInventory(records: any[]) {
  const formattedRecords = records.map(r => {
    const cleanImei = r.imei ? String(r.imei).trim().replace(/\s+/g, '') : '';
    const item: any = {
      sticker: r.sticker || '',
      site_date: r.site_date || new Date().toLocaleDateString('ko-KR').slice(2),
      model_name: r.model_name || '',
      imei: cleanImei || `NO_IMEI-${r.sticker ? r.sticker + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() : 'TEMP-' + Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      color: r.color || '',
      battery_pct: r.battery_pct ? String(r.battery_pct).replace(/[^0-9]/g, '') : '100',
      purchase_cost: Number(String(r.purchase_cost || '').replace(/[^0-9.-]/g, '')) || 0,
      selling_price: Number(String(r.selling_price || '').replace(/[^0-9.-]/g, '')) || 0,
      stock_location: r.stock_location || 'Hong Kong',
      notes: r.notes || '',
      is_sold: r.is_sold || false,
      sale_date: r.sale_date || null,
      seller_name: r.seller_name || null,
      is_approved: r.is_approved || false,
      created_at: r.created_at || new Date().toISOString()
    };

    if (r.id) {
      item.id = r.id;
    } else if (!supabase) {
      item.id = `hk-prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    return item;
  });

  if (supabase) {
    const { data, error } = await supabase
      .from('hongkong_inventory')
      .upsert(formattedRecords, { onConflict: 'imei' })
      .select();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    if (!db.hongkong_inventory) db.hongkong_inventory = [];

    const insertedOrUpdated: any[] = [];
    formattedRecords.forEach(newRec => {
      const idx = db.hongkong_inventory!.findIndex(x => x.imei === newRec.imei);
      if (idx > -1) {
        db.hongkong_inventory![idx] = {
          ...db.hongkong_inventory![idx],
          ...newRec,
          id: db.hongkong_inventory![idx].id
        };
        insertedOrUpdated.push(db.hongkong_inventory![idx]);
      } else {
        db.hongkong_inventory!.push(newRec);
        insertedOrUpdated.push(newRec);
      }
    });

    writeMockDB(db);
    return insertedOrUpdated;
  }
}

export async function processHongKongBulkSale(
  saleDate: string,
  sellerName: string,
  sellingPrice: number,
  soldIds: string[],
  remainingIdentifiers: string[],
  modelPrices?: Record<string, number>
) {
  const cleanRemains = remainingIdentifiers.map(x => String(x).trim().toLowerCase().replace(/\s+/g, '')).filter(Boolean);

  if (supabase) {
    const { data: devices, error: fetchErr } = await supabase
      .from('hongkong_inventory')
      .select('id, imei, sticker, model_name')
      .in('id', soldIds);

    if (fetchErr) throw fetchErr;

    // Group devices by model_name to update model-specific prices
    const devicesByModel: Record<string, any[]> = {};
    (devices || []).forEach(d => {
      const cleanImei = d.imei ? d.imei.toLowerCase().replace(/\s+/g, '') : '';
      const cleanSticker = d.sticker ? d.sticker.toLowerCase().replace(/\s+/g, '') : '';
      const isRemaining = cleanRemains.includes(cleanImei) || cleanRemains.includes(cleanSticker);
      if (!isRemaining) {
        if (!devicesByModel[d.model_name]) {
          devicesByModel[d.model_name] = [];
        }
        devicesByModel[d.model_name].push(d);
      }
    });

    let totalCount = 0;
    for (const [modelName, devs] of Object.entries(devicesByModel)) {
      const ids = devs.map(d => d.id);
      if (ids.length === 0) continue;
      
      const priceForModel = modelPrices ? (modelPrices[modelName] ?? sellingPrice) : sellingPrice;

      const { error: updateErr } = await supabase
        .from('hongkong_inventory')
        .update({
          is_sold: true,
          sale_date: saleDate,
          seller_name: sellerName,
          selling_price: priceForModel,
          is_approved: false
        })
        .in('id', ids);

      if (updateErr) throw updateErr;
      totalCount += ids.length;
    }

    return { count: totalCount };
  } else {
    const db = readMockDB();
    if (!db.hongkong_inventory) db.hongkong_inventory = [];

    let count = 0;
    db.hongkong_inventory = db.hongkong_inventory.map(d => {
      if (soldIds.includes(d.id)) {
        const cleanImei = d.imei ? d.imei.toLowerCase().replace(/\s+/g, '') : '';
        const cleanSticker = d.sticker ? d.sticker.toLowerCase().replace(/\s+/g, '') : '';
        const isRemaining = cleanRemains.includes(cleanImei) || cleanRemains.includes(cleanSticker);

        if (!isRemaining) {
          count++;
          const priceForModel = modelPrices ? (modelPrices[d.model_name] ?? sellingPrice) : sellingPrice;
          return {
            ...d,
            is_sold: true,
            sale_date: saleDate,
            seller_name: sellerName,
            selling_price: priceForModel,
            is_approved: false
          };
        }
      }
      return d;
    });

    writeMockDB(db);
    return { count };
  }
}

export async function updateHongKongNotes(id: string, notes: string) {
  if (supabase) {
    const { error } = await supabase
      .from('hongkong_inventory')
      .update({ notes: notes || null })
      .eq('id', id);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDB();
    if (!db.hongkong_inventory) db.hongkong_inventory = [];

    db.hongkong_inventory = db.hongkong_inventory.map(d => {
      if (d.id === id) {
        return { ...d, notes };
      }
      return d;
    });

    writeMockDB(db);
    return true;
  }
}

export async function approveHongKongSales(deviceIds: string[]) {
  if (supabase) {
    const { error } = await supabase
      .from('hongkong_inventory')
      .update({ is_approved: true })
      .in('id', deviceIds);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDB();
    if (!db.hongkong_inventory) db.hongkong_inventory = [];

    db.hongkong_inventory = db.hongkong_inventory.map(d => {
      if (deviceIds.includes(d.id)) {
        return { ...d, is_approved: true };
      }
      return d;
    });

    writeMockDB(db);
    return true;
  }
}

export async function cancelHongKongSales(deviceIds: string[]) {
  if (supabase) {
    const { error } = await supabase
      .from('hongkong_inventory')
      .update({
        is_sold: false,
        sale_date: null,
        seller_name: null,
        is_approved: false
      })
      .in('id', deviceIds);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDB();
    if (!db.hongkong_inventory) db.hongkong_inventory = [];

    db.hongkong_inventory = db.hongkong_inventory.map(d => {
      if (deviceIds.includes(d.id)) {
        return {
          ...d,
          is_sold: false,
          sale_date: null,
          seller_name: null,
          is_approved: false
        };
      }
      return d;
    });

    writeMockDB(db);
    return true;
  }
}

export async function deleteHongKongInventory(id: string) {
  if (supabase) {
    const { error } = await supabase
      .from('hongkong_inventory')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDB();
    if (!db.hongkong_inventory) db.hongkong_inventory = [];
    db.hongkong_inventory = db.hongkong_inventory.filter(d => d.id !== id);
    writeMockDB(db);
    return true;
  }
}

export async function deleteHongKongInventoryBatch(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  if (supabase) {
    const { error } = await supabase
      .from('hongkong_inventory')
      .delete()
      .in('id', ids);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDB();
    if (!db.hongkong_inventory) db.hongkong_inventory = [];
    db.hongkong_inventory = db.hongkong_inventory.filter(d => !ids.includes(d.id));
    writeMockDB(db);
    return true;
  }
}

// ==========================================
// 8. 기종 펫네임 관리 (Model Pet Names) 데이터 액션
// ==========================================
export async function getModelPetNames() {
  if (supabase) {
    const { data, error } = await supabase
      .from('model_pet_names')
      .select('*')
      .order('model_code', { ascending: true });
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    return db.model_pet_names || [];
  }
}

export async function saveModelPetName(modelCode: string, petNameKo: string, petNameZh: string) {
  const payload = {
    model_code: modelCode.trim(),
    pet_name_ko: petNameKo.trim(),
    pet_name_zh: petNameZh.trim(),
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('model_pet_names')
      .upsert(payload, { onConflict: 'model_code' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDB();
    if (!db.model_pet_names) db.model_pet_names = [];
    
    const idx = db.model_pet_names.findIndex(x => x.model_code === payload.model_code);
    if (idx > -1) {
      db.model_pet_names[idx] = {
        ...db.model_pet_names[idx],
        ...payload
      };
    } else {
      db.model_pet_names.push(payload);
    }
    
    writeMockDB(db);
    return payload;
  }
}

export async function deleteModelPetName(modelCode: string) {
  if (supabase) {
    const { error } = await supabase
      .from('model_pet_names')
      .delete()
      .eq('model_code', modelCode);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDB();
    if (!db.model_pet_names) db.model_pet_names = [];
    db.model_pet_names = db.model_pet_names.filter(x => x.model_code !== modelCode);
    writeMockDB(db);
    return true;
  }
}

