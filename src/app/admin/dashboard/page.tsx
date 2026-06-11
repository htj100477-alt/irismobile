'use client';

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Smartphone, ShoppingBag, ClipboardList, LogOut, CheckCircle2, AlertCircle, Plus, Edit, Trash2, X, Coins, Settings, Layers } from 'lucide-react';
import styles from '@/styles/admin.module.css';

// 이미지 압축 헬퍼 함수
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // JPEG로 변환, 압축 품질 0.7
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// 타입 정의
interface TradeIn {
  id: string;
  brand: string;
  model_name: string;
  storage: string;
  color: string;
  estimated_price: number;
  final_price: number | null;
  status: 'pending' | 'collecting' | 'inspecting' | 'confirmed' | 'paid' | 'cancelled';
  shipping_method: string;
  shipping_address: string;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  admin_notes: string | null;
  created_at: string;
  members: { name: string; phone_number: string } | null;
}

interface Product {
  id: string;
  brand: string;
  model_name: string;
  storage: string;
  color: string;
  price: number;
  grade: 'S' | 'A' | 'B';
  images: string[];
  description: string;
  status: 'available' | 'reserved' | 'sold';
  created_at: string;
  category?: string;
  series?: string;
  battery_efficiency?: string;
  carrier_info?: string;
}

interface Order {
  id: string;
  price: number;
  status: 'pending' | 'shipping' | 'delivered' | 'cancelled';
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  created_at: string;
  members: { name: string; phone_number: string } | null;
  products: { brand: string; model_name: string; storage: string; color: string; grade: string } | null;
}

// 한글 기종 및 펫네임을 중국인 판매자를 위해 중국어/영어 혼용 표기로 자동 번역하는 헬퍼 함수
const translateModelName = (name: string): string => {
  if (!name) return name;
  let translated = name;

  // 갤럭시 Z 폴드 / 플립 시리즈 번역
  translated = translated.replace(/갤럭시\s*Z\s*폴드/gi, '三星 Z Fold');
  translated = translated.replace(/갤럭시\s*Z\s*플립/gi, '三星 Z Flip');
  
  // 갤럭시 S 및 노트 시리즈 번역
  translated = translated.replace(/갤럭시\s*노트/gi, '三星 Note');
  translated = translated.replace(/갤럭시\s*S/gi, '三星 S');
  translated = translated.replace(/갤럭시\s*A/gi, '三星 A');
  translated = translated.replace(/갤럭시/gi, '三星');

  // 아이폰 / 아이패드 / 맥북 번역
  translated = translated.replace(/아이폰/gi, 'iPhone');
  translated = translated.replace(/아이패드/gi, 'iPad');
  translated = translated.replace(/맥북/gi, 'MacBook');

  // 주요 키워드 번역
  translated = translated.replace(/울트라/gi, 'Ultra');
  translated = translated.replace(/플러스/gi, 'Plus');
  translated = translated.replace(/프로/gi, 'Pro');
  translated = translated.replace(/맥스/gi, 'Max');
  translated = translated.replace(/폴드/gi, 'Fold');
  translated = translated.replace(/플립/gi, 'Flip');

  return translated;
};

interface HKInventoryRowProps {
  item: any;
  isChecked: boolean;
  onCheckChange: (id: string, checked: boolean) => void;
  getModelDisplayName: (modelName: string) => string;
  cnyRate: number;
  onCancelSale: (id: string) => void;
  onDelete: (id: string) => void;
  displayLang: 'ko' | 'zh';
}

const HKInventoryRow = memo(function HKInventoryRow({
  item,
  isChecked,
  onCheckChange,
  getModelDisplayName,
  cnyRate,
  onCancelSale,
  onDelete,
  displayLang
}: HKInventoryRowProps) {
  return (
    <tr>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          aria-label={`${item.model_name} 선택`}
          checked={isChecked}
          onChange={(e) => onCheckChange(item.id, e.target.checked)}
        />
      </td>
      <td>{item.site_date}</td>
      <td>{item.sticker || '-'}</td>
      <td style={{ fontWeight: 'bold' }}>{getModelDisplayName(item.model_name)}</td>
      <td style={{ fontFamily: 'monospace' }}>{item.imei?.startsWith('NO_IMEI-') ? '-' : item.imei}</td>
      <td>{item.color || '-'}</td>
      <td style={{ color: 'var(--text-secondary)' }}>
        ₩{Number(item.purchase_cost || 0).toLocaleString()}
      </td>
      <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>
        HK${Number(item.selling_price || 0).toLocaleString()}
        {item.is_sold && (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
            (₩{Math.round(Number(item.selling_price || 0) * cnyRate).toLocaleString()})
          </div>
        )}
      </td>
      <td>{item.stock_location || '-'}</td>
      <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
        {item.notes || '-'}
      </td>
      <td>
        <span style={{
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          backgroundColor: !item.is_sold
            ? 'rgba(16, 185, 129, 0.1)'
            : !item.is_approved
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(255, 255, 255, 0.05)',
          color: !item.is_sold
            ? 'var(--success-color)'
            : !item.is_approved
              ? 'var(--warning-color)'
              : 'var(--text-secondary)'
        }}>
          {!item.is_sold
            ? (displayLang === 'zh' ? '可售' : '판매 가능')
            : !item.is_approved
              ? (displayLang === 'zh' ? '待审批' : '승인 대기')
              : (displayLang === 'zh' ? '已售' : '판매 완료')}
        </span>
      </td>
      <td>
        {item.is_sold && (
          <button
            onClick={() => onCancelSale(item.id)}
            className={styles.btnSave}
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              border: '1px solid var(--warning-color)',
              color: 'var(--warning-color)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            {displayLang === 'zh' ? '取消销售' : '판매 취소'}
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className={styles.btnCancel}
          style={{ padding: '6px 10px', fontSize: '11px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent', cursor: 'pointer' }}
        >
          {displayLang === 'zh' ? '删除' : '삭제'}
        </button>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isChecked === nextProps.isChecked &&
    prevProps.item === nextProps.item &&
    prevProps.displayLang === nextProps.displayLang &&
    prevProps.cnyRate === nextProps.cnyRate &&
    prevProps.getModelDisplayName === nextProps.getModelDisplayName
  );
});

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'trade-ins' | 'products' | 'orders' | 'prices' | 'categories' | 'hongkong-inventory' | 'completed-sales' | 'margin-settlement' | 'model-pet-names'>('home');
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 데이터 리스트
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tradeInPrices, setTradeInPrices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // 홍콩 재고 관리 상태 및 벌크 파서 상태
  const [hongkongInventory, setHongkongInventory] = useState<any[]>([]);
  const [selectedHKIds, setSelectedHKIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkSaleModalOpen, setIsBulkSaleModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [headerMappings, setHeaderMappings] = useState<Record<string, string>>({});
  const [parsedImportRows, setParsedImportRows] = useState<any[]>([]);
  
  // 기종 펫네임 매핑 및 다국어 표시 상태
  const [modelPetNames, setModelPetNames] = useState<any[]>([]);
  const [displayLang, setDisplayLang] = useState<'ko' | 'zh'>('ko');
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);
  const [petModelCode, setPetModelCode] = useState('');
  const [petNameKo, setPetNameKo] = useState('');
  const [petNameZh, setPetNameZh] = useState('');
  const [savingPetName, setSavingPetName] = useState(false);
  const [petSearchQuery, setPetSearchQuery] = useState('');

  // ✅ 성능 최적화: 펫네임 Map 빌드 (O(1) 조회)
  const petNameMap = useMemo(() => {
    const map = new Map<string, { ko: string; zh: string }>();
    for (const x of modelPetNames) {
      map.set(x.model_code.trim().toUpperCase(), { ko: x.pet_name_ko, zh: x.pet_name_zh });
    }
    return map;
  }, [modelPetNames]);

  // 다국어 펫네임 매핑 조회 헬퍼 함수 (Map으로 O(1) 조회)
  const getModelDisplayName = useCallback((modelName: string): string => {
    if (!modelName) return '';
    const cleanModel = modelName.trim().toUpperCase();
    const found = petNameMap.get(cleanModel);
    if (found) {
      const petName = displayLang === 'zh' ? found.zh : found.ko;
      return `${petName} (${modelName})`;
    }
    return modelName;
  }, [petNameMap, displayLang]);
  
  // 일괄 판매 처리 상태
  const [bulkSaleDate, setBulkSaleDate] = useState('');
  const [bulkSellerName, setBulkSellerName] = useState('레이');
  const [bulkRemainingInput, setBulkRemainingInput] = useState('');
  const [bulkSellingPrice, setBulkSellingPrice] = useState<string>(''); // 추가: 위안화 판매가 (기본)
  const [bulkSellingPrices, setBulkSellingPrices] = useState<Record<string, string>>({}); // 기종별 위안화 판매단가
  const [processingBulkSale, setProcessingBulkSale] = useState(false);
  const [selectedBulkModels, setSelectedBulkModels] = useState<string[]>([]);
  const [unsoldBulkDeviceIds, setUnsoldBulkDeviceIds] = useState<string[]>([]);
  const [expandedBulkModels, setExpandedBulkModels] = useState<Record<string, boolean>>({});

  // 신규 탭 검색, 필터링 및 선택 상태
  const [hkStatusFilter, setHkStatusFilter] = useState<'all' | 'available' | 'sold_pending' | 'sold'>('all');
  const [hkSearchQuery, setHkSearchQuery] = useState('');
  const [hkSortColumn, setHkSortColumn] = useState<string | null>(null);
  const [hkSortDirection, setHkSortDirection] = useState<'asc' | 'desc'>('asc');
  const [cnyRate, setCnyRate] = useState<number>(175); // 추가: 홍콩달러 환율

  // 홍콩 재고 페이지네이션 상태
  const [hkPage, setHkPage] = useState(1);
  const [hkPageSize, setHkPageSize] = useState<number | 'all'>(50);
  const [hkViewMode, setHkViewMode] = useState<'list' | 'card'>('list');

  // 검색/필터 변경 시 페이지 1로 리셋
  useEffect(() => {
    setHkPage(1);
  }, [hkStatusFilter, hkSearchQuery, hkSortColumn, hkSortDirection, hkPageSize, hkViewMode]);

  // 기종 카드 일괄 판매 상태
  const [cardBulkSaleModel, setCardBulkSaleModel] = useState<string | null>(null);
  const [excludedDeviceIds, setExcludedDeviceIds] = useState<Set<string>>(new Set());
  const [stickerInput, setStickerInput] = useState('');
  const [cardBulkUnitPrice, setCardBulkUnitPrice] = useState('');
  const [cardBulkSaleDate, setCardBulkSaleDate] = useState('');
  const [lastActionMsg, setLastActionMsg] = useState('');
  const stickerInputRef = useRef<HTMLInputElement>(null);

  const [completedSalesFilter, setCompletedSalesFilter] = useState<'all' | 'sold_pending' | 'sold'>('all');
  const [completedSalesSearch, setCompletedSalesSearch] = useState('');
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);

  // 홍콩 재고 정렬 핸들러
  const handleHKSort = (column: string) => {
    if (hkSortColumn === column) {
      if (hkSortDirection === 'asc') {
        setHkSortDirection('desc');
      } else {
        setHkSortColumn(null);
      }
    } else {
      setHkSortColumn(column);
      setHkSortDirection('asc');
    }
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (column: string) => {
    if (hkSortColumn !== column) {
      return <span style={{ opacity: 0.3, marginLeft: '4px', fontSize: '10px' }}>↕</span>;
    }
    return hkSortDirection === 'asc' 
      ? <span style={{ color: 'var(--accent-light)', marginLeft: '4px', fontSize: '10px' }}>▲</span> 
      : <span style={{ color: 'var(--accent-light)', marginLeft: '4px', fontSize: '10px' }}>▼</span>;
  };

  // ✅ 성능 최적화: 선택된 ID Set (O(1) 조회)
  const selectedHKIdsSet = useMemo(() => new Set(selectedHKIds), [selectedHKIds]);
  const selectedPendingIdsSet = useMemo(() => new Set(selectedPendingIds), [selectedPendingIds]);

  // ✅ 성능 최적화: 홍콩 재고 Map 빌드 (O(1) 조회)
  const inventoryMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const x of hongkongInventory) {
      map.set(x.id, x);
    }
    return map;
  }, [hongkongInventory]);

  // ✅ 성능 최적화: 선택되고 판매 완료된 기기 개수 계산 (O(M) 수준)
  const selectedHKSoldDevicesCount = useMemo(() => {
    let count = 0;
    for (const id of selectedHKIds) {
      const item = inventoryMap.get(id);
      if (item && item.is_sold) {
        count++;
      }
    }
    return count;
  }, [selectedHKIds, inventoryMap]);

  // ✅ 성능 최적화: filteredHKItems useMemo 적용
  const filteredHKItems = useMemo(() => hongkongInventory
    .filter(item => {
      if (hkStatusFilter === 'available') return !item.is_sold;
      if (hkStatusFilter === 'sold_pending') return item.is_sold && !item.is_approved;
      if (hkStatusFilter === 'sold') return item.is_sold && item.is_approved;
      return true;
    })
    .filter(item => {
      const q = hkSearchQuery.toLowerCase();
      const displayName = getModelDisplayName(item.model_name).toLowerCase();
      return (
        (item.model_name || '').toLowerCase().includes(q) ||
        displayName.includes(q) ||
        (item.imei || '').toLowerCase().includes(q) ||
        (item.sticker || '').toLowerCase().includes(q)
      );
    }),
  [hongkongInventory, hkStatusFilter, hkSearchQuery, getModelDisplayName]);

  // ✅ 성능 최적화: sortedHKItems useMemo 적용
  const sortedHKItems = useMemo(() => [...filteredHKItems].sort((a, b) => {
    if (!hkSortColumn) return 0;

    let valA = a[hkSortColumn] ?? '';
    let valB = b[hkSortColumn] ?? '';

    if (hkSortColumn === 'purchase_cost' || hkSortColumn === 'selling_price') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else if (hkSortColumn === 'battery_pct') {
      valA = Number(String(valA).replace(/[^0-9]/g, '')) || 0;
      valB = Number(String(valB).replace(/[^0-9]/g, '')) || 0;
    } else if (hkSortColumn === 'is_sold') {
      // 정렬 상태: 판매 가능(1) -> 승인 대기(2) -> 판매 완료(3)
      const getStatusOrder = (x: any) => {
        if (!x.is_sold) return 1;
        if (!x.is_approved) return 2;
        return 3;
      };
      valA = getStatusOrder(a);
      valB = getStatusOrder(b);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return hkSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return hkSortDirection === 'asc' ? 1 : -1;
    return 0;
  }), [filteredHKItems, hkSortColumn, hkSortDirection]);

  // ✅ 성능 최적화: paginatedHKItems 추가
  const paginatedHKItems = useMemo(() => {
    if (hkPageSize === 'all') return sortedHKItems;
    const start = (hkPage - 1) * hkPageSize;
    return sortedHKItems.slice(start, start + hkPageSize);
  }, [sortedHKItems, hkPage, hkPageSize]);

  // ✅ 성능 최적화 및 편의 기능: 기종별 그룹화 데이터 계산
  const groupedHKModels = useMemo(() => {
    const groups: Record<string, {
      modelName: string;
      total: number;
      available: number;
      pending: number;
      sold: number;
      colors: Record<string, number>;
    }> = {};

    for (const item of filteredHKItems) {
      const model = item.model_name || 'UNKNOWN';
      if (!groups[model]) {
        groups[model] = {
          modelName: model,
          total: 0,
          available: 0,
          pending: 0,
          sold: 0,
          colors: {}
        };
      }
      
      const g = groups[model];
      g.total++;
      if (!item.is_sold) {
        g.available++;
      } else if (!item.is_approved) {
        g.pending++;
      } else {
        g.sold++;
      }
      
      const c = item.color ? item.color.trim() : (displayLang === 'zh' ? '未知' : '미정');
      g.colors[c] = (g.colors[c] || 0) + 1;
    }

    // 수량 순으로 정렬
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [filteredHKItems, displayLang]);

  const [settlementSeller, setSettlementSeller] = useState('All');
  const [settlementSearch, setSettlementSearch] = useState('');

  // 고정 엑셀 양식 열 선택 상태 (체크 시 반영, 해제 시 공란)
  const [importFields, setImportFields] = useState<Record<string, boolean>>({
    pgNo: true,
    modelName: true,
    petName: true,
    imei: true,
    color: true,
    sellPrice: true,
    deductionItem: true
  });

  // 카테고리 관리 상태
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');
  const [uploadingCatImage, setUploadingCatImage] = useState(false);

  // 모달 제어 상태
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);
  const [selectedTradeIn, setSelectedTradeIn] = useState<TradeIn | null>(null);
  const [tradeInStatus, setTradeInStatus] = useState<string>('pending');
  const [tradeInFinalPrice, setTradeInFinalPrice] = useState<number>(0);
  const [tradeInAdminNotes, setTradeInAdminNotes] = useState<string>('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // null이면 등록, 존재하면 수정
  const [prodBrand, setProdBrand] = useState('Apple');
  const [prodModelName, setProdModelName] = useState('');
  const [prodStorage, setProdStorage] = useState('256GB');
  const [prodColor, setProdColor] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodGrade, setProdGrade] = useState<'S' | 'A' | 'B'>('A');
  const [prodImage, setProdImage] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodCategory, setProdCategory] = useState('스마트폰');
  const [prodSeries, setProdSeries] = useState('');
  const [prodBattery, setProdBattery] = useState('95%');
  const [prodCarrier, setProdCarrier] = useState('3사 공용 (알뜰폰/자급제 가능)');

  // 매입 시세 설정 모달 상태
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedPriceRule, setSelectedPriceRule] = useState<any | null>(null);
  const [ruleBrand, setRuleBrand] = useState('Apple');
  const [ruleModelName, setRuleModelName] = useState('');
  const [ruleBasePrice, setRuleBasePrice] = useState<number>(0);
  const [ruleStorage128gDeduct, setRuleStorage128gDeduct] = useState<number>(0);
  const [ruleStorage512gAdd, setRuleStorage512gAdd] = useState<number>(0);
  const [ruleScreenScratchDeduct, setRuleScreenScratchDeduct] = useState<number>(0);
  const [ruleScreenBrokenDeduct, setRuleScreenBrokenDeduct] = useState<number>(0);
  const [ruleBodyScratchDeduct, setRuleBodyScratchDeduct] = useState<number>(0);
  const [ruleBodyBrokenDeduct, setRuleBodyBrokenDeduct] = useState<number>(0);
  const [ruleCameraErrorDeduct, setRuleCameraErrorDeduct] = useState<number>(0);
  const [ruleScreenBurnDeduct, setRuleScreenBurnDeduct] = useState<number>(0);
  const [ruleCategory, setRuleCategory] = useState('스마트폰');
  const [ruleSeries, setRuleSeries] = useState('');

  // 기등록된 시리즈 목록 추출 (중복 제거 및 가나다 정렬)
  const allSeries = Array.from(new Set([
    ...(tradeInPrices || []).map(r => r.series),
    ...(products || []).map(p => p.series)
  ].filter(Boolean))).sort() as string[];

  // 시세 필터 및 검색 상태
  const [priceFilterBrand, setPriceFilterBrand] = useState<'All' | 'Apple' | 'Samsung'>('All');
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [priceFilterSub, setPriceFilterSub] = useState<string>('All');

  // 1. 관리자 토큰 검증
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      loadAllData();
    }
  }, [router]);

  // 전역 데이터 페칭
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 모든 API 요청을 병렬(Parallel)로 동시에 시작하여 로딩 시간 단축
      const [tradeRes, prodRes, orderRes, priceRes, catRes, hkRes, rateRes, petRes] = await Promise.all([
        fetch('/api/trade-ins'),
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/trade-in-prices'),
        fetch('/api/categories'),
        fetch('/api/hongkong-inventory'),
        fetch('/api/exchange-rate'),
        fetch('/api/model-pet-names')
      ]);

      // 응답 JSON 파싱도 병렬로 처리
      const [tradeData, prodData, orderData, priceData, catData, hkData, rateData, petData] = await Promise.all([
        tradeRes.json(),
        prodRes.json(),
        orderRes.json(),
        priceRes.json(),
        catRes.json(),
        hkRes.json(),
        rateRes.json(),
        petRes.json()
      ]);

      if (tradeData.success) setTradeIns(tradeData.data);
      if (prodData.success) setProducts(prodData.data);
      if (orderData.success) setOrders(orderData.data);
      if (priceData.success) setTradeInPrices(priceData.data);
      if (catData.success) setCategories(catData.data);
      if (hkData.success) setHongkongInventory(hkData.data);
      if (rateData?.success) setCnyRate(rateData.rate);
      if (petData.success) setModelPetNames(petData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. 매입 승인 관리 액션 (수정 모달 오픈)
  const openTradeInModal = (trade: TradeIn) => {
    setSelectedTradeIn(trade);
    setTradeInStatus(trade.status);
    setTradeInFinalPrice(trade.final_price || trade.estimated_price);
    setTradeInAdminNotes(trade.admin_notes || '');
    setIsTradeInModalOpen(true);
  };

  const saveTradeInChanges = async () => {
    if (!selectedTradeIn) return;

    try {
      const res = await fetch('/api/trade-ins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTradeIn.id,
          status: tradeInStatus,
          final_price: tradeInStatus === 'confirmed' || tradeInStatus === 'paid' ? tradeInFinalPrice : null,
          admin_notes: tradeInAdminNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsTradeInModalOpen(false);
        loadAllData();
      } else {
        alert(data.error || '매입 정보 업데이트 실패');
      }
    } catch (err) {
      alert('서버 응답 오류가 발생했습니다.');
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // 1. 클라이언트 측 이미지 압축
      const compressedBase64 = await compressImage(file);
      
      // 2. 서버 업로드 API 호출
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: compressedBase64,
          fileName: file.name
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProdImage(data.url);
      } else {
        alert(data.error || '이미지 업로드 실패');
      }
    } catch (err) {
      console.error(err);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCategoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCatImage(true);
    try {
      const compressedBase64 = await compressImage(file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: compressedBase64,
          fileName: file.name
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCatImage(data.url);
      } else {
        alert(data.error || '이미지 업로드 실패');
      }
    } catch (err) {
      console.error(err);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setUploadingCatImage(false);
    }
  };

  // 펫네임 추가 또는 수정 저장
  const handleSavePetName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petModelCode.trim() || !petNameKo.trim() || !petNameZh.trim()) {
      alert('모든 필드를 입력해 주세요.');
      return;
    }

    setSavingPetName(true);
    try {
      const res = await fetch('/api/model-pet-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelCode: petModelCode.trim(),
          petNameKo: petNameKo.trim(),
          petNameZh: petNameZh.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        // 새로고침
        const petRes = await fetch('/api/model-pet-names');
        const petData = await petRes.json();
        if (petData.success) {
          setModelPetNames(petData.data);
        }
        setIsPetModalOpen(false);
        // Reset states
        setPetModelCode('');
        setPetNameKo('');
        setPetNameZh('');
        setSelectedPet(null);
      } else {
        alert('저장 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Save pet name error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSavingPetName(false);
    }
  };

  // 펫네임 삭제
  const handleDeletePetName = async (modelCode: string) => {
    if (!confirm(`'${modelCode}' 모델의 펫네임 설정을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/model-pet-names?modelCode=${encodeURIComponent(modelCode)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setModelPetNames(modelPetNames.filter(x => x.model_code !== modelCode));
      } else {
        alert('삭제 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Delete pet name error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 펫네임 수정 모달 열기
  const openEditPetModal = (pet: any) => {
    setSelectedPet(pet);
    setPetModelCode(pet.model_code);
    setPetNameKo(pet.pet_name_ko);
    setPetNameZh(pet.pet_name_zh);
    setIsPetModalOpen(true);
  };

  // 펫네임 등록 모달 열기
  const openAddPetModal = () => {
    setSelectedPet(null);
    setPetModelCode('');
    setPetNameKo('');
    setPetNameZh('');
    setIsPetModalOpen(true);
  };

  // 3. 중고폰 상품 관리 액션 (등록/수정 모달 오픈)
  const openProductModal = (prod: Product | null = null) => {
    setSelectedProduct(prod);
    if (prod) {
      // 수정 모드
      setProdBrand(prod.brand);
      setProdModelName(prod.model_name);
      setProdStorage(prod.storage);
      setProdColor(prod.color);
      setProdPrice(prod.price);
      setProdGrade(prod.grade);
      setProdImage(prod.images[0] || '');
      setProdDescription(prod.description || '');
      setProdCategory(prod.category || '스마트폰');
      setProdSeries(prod.series || '');
      setProdBattery(prod.battery_efficiency || '95%');
      setProdCarrier(prod.carrier_info || '3사 공용 (알뜰폰/자급제 가능)');
    } else {
      // 신규 등록 모드
      setProdBrand('Apple');
      setProdModelName('');
      setProdStorage('256GB');
      setProdColor('');
      setProdPrice(0);
      setProdGrade('A');
      setProdImage('');
      setProdDescription('');
      setProdCategory(categories[0]?.name || '스마트폰');
      setProdSeries('');
      setProdBattery('95%');
      setProdCarrier('3사 공용 (알뜰폰/자급제 가능)');
    }
    setIsProductModalOpen(true);
  };

  const saveProduct = async () => {
    if (!prodModelName || !prodColor || !prodPrice) {
      alert('상품 기본 정보를 모두 입력해주세요.');
      return;
    }

    const payload = {
      brand: prodBrand,
      model_name: prodModelName,
      storage: prodStorage,
      color: prodColor,
      price: prodPrice,
      grade: prodGrade,
      images: prodImage ? [prodImage] : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'],
      description: prodDescription,
      category: prodCategory,
      series: prodSeries,
      battery_efficiency: prodBattery,
      carrier_info: prodCarrier,
    };

    try {
      let res;
      if (selectedProduct) {
        // 수정 요청
        res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedProduct.id, ...payload }),
        });
      } else {
        // 신규 추가 요청
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setIsProductModalOpen(false);
        loadAllData();
      } else {
        alert(data.error || '상품 정보 저장 실패');
      }
    } catch (err) {
      alert('서버 처리 오류가 발생했습니다.');
    }
  };

  const deleteProd = async (id: string) => {
    if (!confirm('정말로 이 상품을 쇼핑몰에서 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAllData();
      } else {
        alert('상품 삭제 실패');
      }
    } catch (err) {
      alert('서버 처리 오류');
    }
  };

  // 4. 주문 배송 상태 직접 변경 액션
  const handleOrderStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        loadAllData();
      } else {
        alert('배송 상태 업데이트 실패');
      }
    } catch (err) {
      alert('서버 처리 오류');
    }
  };

  // 5. 매입 시세 관리 액션
  const openPriceModal = (rule: any | null = null) => {
    setSelectedPriceRule(rule);
    if (rule) {
      // 수정 모드
      setRuleBrand(rule.brand);
      setRuleModelName(rule.model_name);
      setRuleBasePrice(rule.base_price);
      setRuleStorage128gDeduct(rule.storage_128g_deduct);
      setRuleStorage512gAdd(rule.storage_512g_add);
      setRuleScreenScratchDeduct(rule.screen_scratch_deduct);
      setRuleScreenBrokenDeduct(rule.screen_broken_deduct);
      setRuleBodyScratchDeduct(rule.body_scratch_deduct);
      setRuleBodyBrokenDeduct(rule.body_broken_deduct);
      setRuleCameraErrorDeduct(rule.camera_error_deduct);
      setRuleScreenBurnDeduct(rule.screen_burn_deduct);
      setRuleCategory(rule.category || '스마트폰');
      setRuleSeries(rule.series || '');
    } else {
      // 신규 등록 모드
      setRuleBrand('Apple');
      setRuleModelName('');
      setRuleBasePrice(1000000);
      setRuleStorage128gDeduct(80000);
      setRuleStorage512gAdd(120000);
      setRuleScreenScratchDeduct(70000);
      setRuleScreenBrokenDeduct(250000);
      setRuleBodyScratchDeduct(40000);
      setRuleBodyBrokenDeduct(120000);
      setRuleCameraErrorDeduct(100000);
      setRuleScreenBurnDeduct(80000);
      setRuleCategory(categories[0]?.name || '스마트폰');
      setRuleSeries('');
    }
    setIsPriceModalOpen(true);
  };

  const savePriceRule = async () => {
    if (!ruleModelName) {
      alert('기종 모델명을 입력해주세요.');
      return;
    }

    const payload = {
      brand: ruleBrand,
      model_name: ruleModelName,
      base_price: ruleBasePrice,
      storage_128g_deduct: ruleStorage128gDeduct,
      storage_512g_add: ruleStorage512gAdd,
      screen_scratch_deduct: ruleScreenScratchDeduct,
      screen_broken_deduct: ruleScreenBrokenDeduct,
      body_scratch_deduct: ruleBodyScratchDeduct,
      body_broken_deduct: ruleBodyBrokenDeduct,
      camera_error_deduct: ruleCameraErrorDeduct,
      screen_burn_deduct: ruleScreenBurnDeduct,
      category: ruleCategory,
      series: ruleSeries
    };

    try {
      let res;
      if (selectedPriceRule) {
        // 수정 요청
        res = await fetch('/api/trade-in-prices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedPriceRule.id, ...payload })
        });
      } else {
        // 신규 추가 요청
        res = await fetch('/api/trade-in-prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setIsPriceModalOpen(false);
        loadAllData();
      } else {
        alert(data.error || '시세 정보 저장 실패');
      }
    } catch (err) {
      alert('서버 처리 오류가 발생했습니다.');
    }
  };

  // 6. 카테고리 관리 액션
  const openCategoryModal = (cat: any | null = null) => {
    setSelectedCategory(cat);
    if (cat) {
      setCatName(cat.name);
      setCatImage(cat.image);
    } else {
      setCatName('');
      setCatImage('');
    }
    setIsCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    if (!catName || !catImage) {
      alert('카테고리명과 대표 이미지를 모두 등록해주세요.');
      return;
    }

    const payload = {
      name: catName,
      image: catImage
    };

    try {
      let res;
      if (selectedCategory) {
        // 수정 요청
        res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedCategory.id, ...payload })
        });
      } else {
        // 신규 등록 요청
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setIsCategoryModalOpen(false);
        loadAllData();
      } else {
        alert(data.error || '카테고리 저장 실패');
      }
    } catch (err) {
      alert('서버 오류');
    }
  };

  const deleteCat = async (id: string) => {
    if (!confirm('정말로 이 카테고리를 삭제하시겠습니까? 연결된 상품들의 분류에 영향을 미칠 수 있습니다.')) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAllData();
      } else {
        alert('카테고리 삭제 실패');
      }
    } catch (err) {
      alert('서버 오류');
    }
  };

  // 관리자 로그아웃
  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  // ==========================================
  // 홍콩 재고 및 정산 관리 핸들러 함수
  // ==========================================

  // 고정 엑셀 열 레이아웃 파싱 공통 헬퍼 (붙여넣은 헤더 첫 행에서 인덱스를 동적으로 찾아 정렬)
  const recalculateParsedRows = (
    text: string,
    fields: Record<string, boolean>
  ) => {
    if (!text.trim()) {
      setParsedImportRows([]);
      return;
    }
    const lines = text.trim().split(/\r?\n/).map(row => row.split('\t').map(cell => cell.trim()));
    const firstRow = lines[0] || [];
    const firstRowClean = firstRow.map(h => h.toLowerCase().replace(/\s+/g, ''));

    // 헤더 열이 있으면 인덱스를 찾아 매칭하고, 없을 시 기본 순번 기준 인덱스로 대체 (순번 복사 안 한 경우 고려)
    const findIdx = (keywords: string[], fallback: number) => {
      const idx = firstRowClean.findIndex(h => keywords.some(k => h.includes(k)));
      return idx > -1 ? idx : fallback;
    };

    // exact match helper
    const findExactIdx = (keywords: string[], fallback: number) => {
      const idx = firstRowClean.findIndex(h => keywords.some(k => h === k));
      return idx > -1 ? idx : fallback;
    };

    // 순번 포함 시: pgNo=1, modelName=2, petName=3, imei=5, color=7, sellPrice=10, deductionItem=11
    // 순번 미포함 시: pgNo=0, modelName=1, petName=2, imei=4, color=6, sellPrice=9, deductionItem=10
    const hasSeq = firstRowClean.some(h => h.includes('순번'));
    const offset = hasSeq ? 1 : 0;

    const pgIdx = findIdx(['p/g', 'pg'], 0 + offset);
    const modelIdx = findIdx(['모델명'], 1 + offset);
    const petIdx = findIdx(['펫네임'], 2 + offset);
    const imeiIdx = findExactIdx(['imei'], findIdx(['imei'], 4 + offset));
    const colorIdx = findIdx(['색상', 'color'], 6 + offset);
    const priceIdx = findExactIdx(['실판매가'], findIdx(['실판매가', 'price'], 9 + offset));
    const deductionItemIdx = findExactIdx(['차감항목'], findIdx(['차감항목'], 10 + offset));

    const parsedRows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;
      
      const item: any = {};
      
      // 1. 모델명만 가져오고 펫네임은 무시 (번역 및 결합 루프를 제외해 병목현상 차단)
      let mName = '';
      if (fields.modelName && modelIdx < row.length && row[modelIdx]) {
        mName = row[modelIdx];
      }
      item.model_name = mName.trim() || '기형 미확인 / 未知型号';

      // 2. 일련번호 (Sticker) -> P/G No가 Sticker이다!
      item.sticker = fields.pgNo && pgIdx < row.length && row[pgIdx] ? row[pgIdx] : '';

      // 3. IMEI
      item.imei = fields.imei && imeiIdx < row.length && row[imeiIdx] ? row[imeiIdx] : '';

      // 4. 색상
      item.color = fields.color && colorIdx < row.length && row[colorIdx] ? row[colorIdx] : '';

      // 5. 원가 (Excel의 실판매가가 우리에게는 원가!)
      item.purchase_cost = fields.sellPrice && priceIdx < row.length && row[priceIdx] ? row[priceIdx] : '0';

      // 6. 판매가 (입고 시점에는 판매가가 아직 없으므로 0)
      item.selling_price = '0';

      // 7. 배터리 (기본 100%)
      item.battery_pct = '100';

      // 8. 위치 (기본 Hong Kong)
      item.stock_location = 'Hong Kong';

      // 9. 비고 (차감항목만 비고 필드에 저장)
      item.notes = fields.deductionItem && deductionItemIdx < row.length && row[deductionItemIdx] ? row[deductionItemIdx] : '';

      parsedRows.push(item);
    }
    setParsedImportRows(parsedRows);
  };

  // 대량 붙여넣기 파싱 실행
  const handlePasteChange = (text: string) => {
    setPasteText(text);
    if (!text.trim()) {
      setDetectedHeaders([]);
      setParsedImportRows([]);
      return;
    }
    const lines = text.trim().split(/\r?\n/).map(row => row.split('\t').map(cell => cell.trim()));
    const firstRow = lines[0] || [];
    setDetectedHeaders(firstRow);
    recalculateParsedRows(text, importFields);
  };

  // 대량 입고 데이터 저장 실행
  const executeImport = async () => {
    if (parsedImportRows.length === 0) {
      alert('가져올 데이터가 없습니다. 클립보드 데이터를 확인해주세요.');
      return;
    }
    const validRecords = parsedImportRows.filter(r => r.model_name);
    if (validRecords.length === 0) {
      alert('유효한 모델명을 가진 행이 없습니다.');
      return;
    }

    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: validRecords })
      });
      const data = await res.json();
      if (data.success) {
        alert(`성공적으로 ${validRecords.length}대의 재고를 입고했습니다! (Successfully imported ${validRecords.length} devices)`);
        setIsImportModalOpen(false);
        setPasteText('');
        setDetectedHeaders([]);
        setParsedImportRows([]);
        loadAllData();
      } else {
        alert(data.error || '입고 처리 실패');
      }
    } catch (e) {
      alert('네트워크 또는 서버 오류가 발생했습니다.');
    }
  };

  // 일괄 판매완료 처리 (그룹 모델 기준)
  const executeBulkSale = async () => {
    if (!bulkSellerName.trim()) {
      alert('판매원 이름을 입력해주세요. / 请输入销售员姓名。');
      return;
    }
    if (!bulkSaleDate) {
      alert('판매 날짜를 선택해주세요. / 请选择销售日期。');
      return;
    }
    if (selectedBulkModels.length === 0) {
      alert('판매 완료 처리할 기종을 하나 이상 선택해주세요.');
      return;
    }

    // 각 선택 모델 기종별 단가 검증 및 맵 구성
    const modelPrices: Record<string, number> = {};
    for (const modelName of selectedBulkModels) {
      const priceStr = bulkSellingPrices[modelName];
      if (!priceStr || isNaN(Number(priceStr)) || Number(priceStr) <= 0) {
        alert(`${modelName}의 올바른 홍콩달러(HKD) 판매단가를 입력해주세요. / 请输入 ${modelName} 的正确销售单价。`);
        return;
      }
      modelPrices[modelName] = Number(priceStr);
    }

    const availableHKDevices = hongkongInventory.filter(x => !x.is_sold);
    const candidateDevices = availableHKDevices.filter(x => selectedBulkModels.includes(x.model_name));
    const soldDevices = candidateDevices.filter(x => !unsoldBulkDeviceIds.includes(x.id));
    const unsoldDevices = candidateDevices.filter(x => unsoldBulkDeviceIds.includes(x.id));

    if (soldDevices.length === 0) {
      alert('선택한 기종 중 판매 완료할 기기가 없습니다. 모든 기기가 미판매로 제외되었습니다.');
      return;
    }

    const priceDetails = selectedBulkModels.map(m => `- ${m}: HK$${Number(bulkSellingPrices[m]).toLocaleString()} (HKD)`).join('\n');

    const confirmMsg = `선택하신 기종 총 ${candidateDevices.length}대 중\n` +
      `- 판매 완료 처리: ${soldDevices.length}대\n` +
      `- 기종별 판매 단가:\n${priceDetails}\n` +
      `- 미판매 제외(재고 보존): ${unsoldDevices.length}대\n\n` +
      `정말로 판매 완료 처리를 실행하시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    setProcessingBulkSale(true);
    try {
      const remainingIdentifiers = unsoldDevices.map(d => d.imei || d.sticker).filter(Boolean);
      const soldIds = candidateDevices.map(d => d.id);

      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sell',
          saleDate: bulkSaleDate,
          sellerName: bulkSellerName.trim(),
          sellingPrice: 0,
          modelPrices,
          soldIds,
          remainingIdentifiers
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`성공적으로 판매 처리가 완료되었습니다! (총 ${data.count}대 판매완료)\nSuccessfully processed ${data.count} sales!`);
        setIsBulkSaleModalOpen(false);
        // Reset states
        setSelectedBulkModels([]);
        setUnsoldBulkDeviceIds([]);
        setExpandedBulkModels({});
        setBulkSellerName('레이');
        setBulkSaleDate('');
        setBulkSellingPrice('');
        setBulkSellingPrices({});
        loadAllData();
      } else {
        alert(data.error || '판매 완료 처리 실패');
      }
    } catch (e) {
      alert('서버 처리 오류가 발생했습니다.');
    } finally {
      setProcessingBulkSale(false);
    }
  };

  // 기종 카드 일괄 판매 모달 오픈
  const openCardBulkSaleModal = useCallback((modelName: string) => {
    setCardBulkSaleModel(modelName);
    setExcludedDeviceIds(new Set());
    setStickerInput('');
    setCardBulkUnitPrice('');
    setCardBulkSaleDate(bulkSaleDate || new Date().toISOString().split('T')[0]);
    setLastActionMsg('');
  }, [bulkSaleDate]);

  // 기종 카드 일괄 판매 처리 실행
  const executeCardBulkSale = async () => {
    if (!cardBulkSaleModel) return;
    if (!bulkSellerName.trim()) {
      alert('판매원 이름을 입력해주세요. / 请输入销售员姓名。');
      return;
    }
    if (!cardBulkSaleDate) {
      alert('판매 날짜를 선택해주세요. / 请选择销售日期。');
      return;
    }
    if (!cardBulkUnitPrice || isNaN(Number(cardBulkUnitPrice)) || Number(cardBulkUnitPrice) <= 0) {
      alert('올바른 홍콩달러(HKD) 판매단가를 입력해주세요. / 请输入正确的销售单价。');
      return;
    }

    const availableHKDevices = hongkongInventory.filter(x => x.model_name === cardBulkSaleModel && !x.is_sold);
    const excludedDevices = availableHKDevices.filter(x => excludedDeviceIds.has(x.id));
    const soldDevices = availableHKDevices.filter(x => !excludedDeviceIds.has(x.id));

    if (soldDevices.length === 0) {
      alert('판매 완료 처리할 기기가 없습니다. 모든 기기가 제외되었습니다.');
      return;
    }

    const confirmMsg = `기종: ${getModelDisplayName(cardBulkSaleModel)}\n` +
      `- 판매 처리: ${soldDevices.length}대\n` +
      `- 판매 단가: HK$${Number(cardBulkUnitPrice).toLocaleString()} (HKD)\n` +
      `- 제외 기기: ${excludedDevices.length}대\n\n` +
      `정말로 판매 처리를 실행하시겠습니까?\n确认执行批量销售吗？`;

    if (!confirm(confirmMsg)) return;

    setProcessingBulkSale(true);
    try {
      const soldIds = availableHKDevices.map(d => d.id);
      const remainingIdentifiers = excludedDevices.flatMap(d => [d.imei, d.sticker]).filter(Boolean);
      const modelPrices = { [cardBulkSaleModel]: Number(cardBulkUnitPrice) };

      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sell',
          saleDate: cardBulkSaleDate,
          sellerName: bulkSellerName.trim(),
          sellingPrice: 0,
          modelPrices,
          soldIds,
          remainingIdentifiers
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`성공적으로 ${soldDevices.length}대의 판매 처리가 완료되었습니다!`);
        setCardBulkSaleModel(null);
        loadAllData();
      } else {
        alert(data.error || '판매 처리 실패');
      }
    } catch (e) {
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setProcessingBulkSale(false);
    }
  };

  // 판매완료 기기 최종 정산 승인
  const executeFinalApproval = async (deviceIds: string[]) => {
    if (deviceIds.length === 0) return;
    if (!confirm(`선택한 ${deviceIds.length}건의 판매를 최종 승인하고 마진 장부에 등록하시겠습니까? \n确认最终审批这 ${deviceIds.length} 笔销售并记入利润账本吗？`)) return;

    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          deviceIds
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('판매 건 최종 승인이 완료되었습니다! / 销售最终审批已完成！');
        loadAllData();
      } else {
        alert(data.error || '승인 처리 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  // 홍콩 재고 단건 삭제
  const executeDeleteHK = useCallback(async (id: string) => {
    if (!confirm('정말로 이 재고를 목록에서 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/hongkong-inventory?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadAllData();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  }, [loadAllData]);

  // 홍콩 재고 선택 항목 일괄 삭제
  const executeDeleteHKBatch = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}대의 재고 데이터를 목록에서 완전히 삭제하시겠습니까?\n确认完全删除这 ${ids.length} 台设备库存数据吗？`)) return;
    
    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (data.success) {
        alert(`성공적으로 ${ids.length}대의 재고를 삭제했습니다!`);
        setSelectedHKIds([]);
        loadAllData();
      } else {
        alert(data.error || '일괄 삭제 실패');
      }
    } catch (e) {
      alert('삭제 중 서버 통신 오류가 발생했습니다.');
    }
  }, [loadAllData]);

  // 홍콩 재고 판매 취소
  const executeCancelSales = useCallback(async (deviceIds: string[]) => {
    if (deviceIds.length === 0) return;
    const msg = deviceIds.length === 1 
      ? '이 기기의 판매를 취소하고 판매 가능 재고로 되돌리시겠습니까?' 
      : `선택한 ${deviceIds.length}대 기기의 판매를 취소하고 판매 가능 재고로 되돌리시겠습니까?`;
      
    if (!confirm(msg)) return;
    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_sale', deviceIds })
      });
      const data = await res.json();
      if (data.success) {
        const deviceIdSet = new Set(deviceIds);
        setSelectedHKIds(prev => prev.filter(id => !deviceIdSet.has(id)));
        loadAllData();
      } else {
        alert(data.error || '판매 취소 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  }, [loadAllData]);

  // stable row action handlers
  const handleHKCheckChange = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedHKIds(prev => [...prev, id]);
    } else {
      setSelectedHKIds(prev => prev.filter(x => x !== id));
    }
  }, []);

  const handleCancelSale = useCallback((id: string) => {
    executeCancelSales([id]);
  }, [executeCancelSales]);

  const handleDeleteHK = useCallback((id: string) => {
    executeDeleteHK(id);
  }, [executeDeleteHK]);

  // 지표 계산기
  const getStats = () => {
    const totalPaid = tradeIns
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + (t.final_price || t.estimated_price), 0);
    
    const activeRequests = tradeIns.filter(t => t.status !== 'paid' && t.status !== 'cancelled').length;
    
    const totalSales = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.price, 0);

    return { totalPaid, activeRequests, totalSales };
  };

  const stats = getStats();

  if (loading && tradeIns.length === 0) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '100px 0', fontSize: '14px' }}>
        관리자 콘솔 데이터 로드 중...
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      
      {/* 1. 사이드 바 */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>TRUE MOBILE ADMIN</div>
        
        <nav className={styles.menuList}>
          <button 
            onClick={() => setActiveTab('home')}
            className={`${styles.menuItem} ${activeTab === 'home' ? styles.menuItemActive : ''}`}
          >
            <BarChart3 size={18} /> 대시보드 홈
          </button>
          
          <button 
            onClick={() => setActiveTab('trade-ins')}
            className={`${styles.menuItem} ${activeTab === 'trade-ins' ? styles.menuItemActive : ''}`}
          >
            <Smartphone size={18} /> 매입 신청 관리 ({tradeIns.length})
          </button>
          
          <button 
            onClick={() => setActiveTab('products')}
            className={`${styles.menuItem} ${activeTab === 'products' ? styles.menuItemActive : ''}`}
          >
            <ShoppingBag size={18} /> 판매 상품 관리 ({products.length})
          </button>
          
          <button 
            onClick={() => setActiveTab('orders')}
            className={`${styles.menuItem} ${activeTab === 'orders' ? styles.menuItemActive : ''}`}
          >
            <ClipboardList size={18} /> 주문 배송 관리 ({orders.length})
          </button>
          
          <button 
            onClick={() => setActiveTab('prices')}
            className={`${styles.menuItem} ${activeTab === 'prices' ? styles.menuItemActive : ''}`}
          >
            <Settings size={18} /> 매입 시세 설정 ({tradeInPrices.length})
          </button>

          <button 
            onClick={() => setActiveTab('categories')}
            className={`${styles.menuItem} ${activeTab === 'categories' ? styles.menuItemActive : ''}`}
          >
            <Layers size={18} /> 카테고리 관리 ({categories.length})
          </button>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }} />

          <button 
            onClick={() => {
              setActiveTab('hongkong-inventory');
              setHkViewMode('card');
              setHkSearchQuery('');
            }}
            className={`${styles.menuItem} ${activeTab === 'hongkong-inventory' ? styles.menuItemActive : ''}`}
          >
            <Smartphone size={18} /> 홍콩 재고 관리
          </button>

          <button 
            onClick={() => setActiveTab('completed-sales')}
            className={`${styles.menuItem} ${activeTab === 'completed-sales' ? styles.menuItemActive : ''}`}
          >
            <CheckCircle2 size={18} /> 판매 완료 내역
          </button>

          <button 
            onClick={() => setActiveTab('margin-settlement')}
            className={`${styles.menuItem} ${activeTab === 'margin-settlement' ? styles.menuItemActive : ''}`}
          >
            <Coins size={18} /> 마진 및 정산
          </button>

          <button 
            onClick={() => setActiveTab('model-pet-names')}
            className={`${styles.menuItem} ${activeTab === 'model-pet-names' ? styles.menuItemActive : ''}`}
          >
            <Settings size={18} style={{ color: 'var(--accent-light)' }} /> 기종 펫네임 관리 ({modelPetNames.length})
          </button>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }} />

          <a 
            href="/admin/scanner"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.menuItem}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <Smartphone size={18} style={{ color: 'var(--warning-color)' }} />
            <span style={{ color: 'var(--warning-color)' }}>바코드 스캐너 / 扫码销售 ↗</span>
          </a>
        </nav>

        <button 
          onClick={handleLogout}
          style={{ marginTop: 'auto' }}
          className={styles.menuItem}
        >
          <LogOut size={18} style={{ color: 'var(--danger-color)' }} />
          <span style={{ color: 'var(--danger-color)' }}>로그아웃</span>
        </button>
      </aside>

      {/* 2. 메인 대시보드 */}
      <main className={styles.mainContent}>
        
        {/* 글로벌 위안화 환율 상단 바 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '16px',
          fontSize: '13px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success-color)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontWeight: 'bold',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Coins size={14} /> 홍콩달러 환율 / 汇率 (Naver HKD/KRW): ₩{cnyRate.toFixed(2)}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              * 마진 계산 시 본 환율 기준으로 원화(KRW)로 자동 환산됩니다. (HKD HK$ → KRW ₩)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 한국, 중국 언어 전환 토글 */}
            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                onClick={() => setDisplayLang('ko')}
                style={{
                  backgroundColor: displayLang === 'ko' ? '#2563eb' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: displayLang === 'ko' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                한국어
              </button>
              <button
                onClick={() => setDisplayLang('zh')}
                style={{
                  backgroundColor: displayLang === 'zh' ? '#2563eb' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: displayLang === 'zh' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                中文
              </button>
            </div>

            <button 
              onClick={loadAllData} 
              className={styles.btnCancel} 
              style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border-color)', cursor: 'pointer', margin: 0, height: 'auto' }}
            >
              환율 & 데이터 갱신 / 刷新
            </button>
          </div>
        </div>

        {/* 대시보드 홈 탭 */}
        {activeTab === 'home' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>대시보드 종합 요약</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>실시간 거래 집계</span>
            </div>

            {/* 통계 지표 카드 */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>총 매입 정산 지출</span>
                  <span className={styles.metricVal}>{stats.totalPaid.toLocaleString()}원</span>
                </div>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                  <Coins size={22} />
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>진행중인 매입 건수</span>
                  <span className={styles.metricVal}>{stats.activeRequests}건</span>
                </div>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
                  <Smartphone size={22} />
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>총 중고폰 판매 매출</span>
                  <span className={styles.metricVal}>{stats.totalSales.toLocaleString()}원</span>
                </div>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                  <ShoppingBag size={22} />
                </div>
              </div>
            </div>

            {/* 현황 요약 리스트 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <span className={styles.tableTitle}>최근 접수된 매입 신청</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>고객명</th>
                        <th>기종</th>
                        <th>자가진단가</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeIns.slice(0, 5).map(t => (
                        <tr key={t.id}>
                          <td>{t.members?.name || '가입탈퇴'}</td>
                          <td>{t.brand} {t.model_name} ({t.storage})</td>
                          <td>{t.estimated_price.toLocaleString()}원</td>
                          <td>{t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <span className={styles.tableTitle}>최근 접수된 주문</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>구매자</th>
                        <th>금액</th>
                        <th>배송상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td>{o.shipping_name}</td>
                          <td>{o.price.toLocaleString()}원</td>
                          <td>{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 매입 신청 관리 탭 */}
        {activeTab === 'trade-ins' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>매입(수거 및 검수) 관리</h2>
              <button onClick={loadAllData} className={styles.btnCancel} style={{ padding: '8px 14px' }}>새로고침</button>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>신청 날짜</th>
                      <th>고객명 (연락처)</th>
                      <th>제조사/기종</th>
                      <th>용량/색상</th>
                      <th>자가진단금액</th>
                      <th>최종확정가</th>
                      <th>상태</th>
                      <th>검수 액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeIns.map(t => (
                      <tr key={t.id}>
                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                        <td>
                          {t.members?.name || '가입탈퇴'}<br />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {t.members?.phone_number.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                          </span>
                        </td>
                        <td>{t.brand} {t.model_name}</td>
                        <td>{t.storage} / {t.color || '기본'}</td>
                        <td>{t.estimated_price.toLocaleString()}원</td>
                        <td>
                          {t.final_price !== null ? (
                            <span style={{ fontWeight: 'bold', color: 'var(--warning-color)' }}>{t.final_price.toLocaleString()}원</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: t.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : t.status === 'confirmed' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: t.status === 'paid' ? 'var(--success-color)' : t.status === 'confirmed' ? 'var(--warning-color)' : '#fff'
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => openTradeInModal(t)}
                            className={styles.btnCancel}
                            style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--accent-light)', color: 'var(--accent-light)', backgroundColor: 'transparent' }}
                          >
                            상태변경 / 가격조정
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 판매 상품 관리 탭 */}
        {activeTab === 'products' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>중고폰 판매 상품 관리</h2>
              <button onClick={() => openProductModal(null)} className={styles.btnSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> 신규 판매 휴대폰 등록
              </button>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>기기 썸네일</th>
                      <th>브랜드</th>
                      <th>기종 모델명</th>
                      <th>저장 용량</th>
                      <th>색상</th>
                      <th>안심등급</th>
                      <th>판매 가격</th>
                      <th>판매 상태</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={p.images[0]} 
                            alt={p.model_name}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                          />
                        </td>
                        <td>{p.brand}</td>
                        <td style={{ fontWeight: 'bold' }}>{p.model_name}</td>
                        <td>{p.storage}</td>
                        <td>{p.color}</td>
                        <td>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: p.grade === 'S' ? '#d97706' : p.grade === 'A' ? '#4f46e5' : '#4b5563',
                            color: '#fff'
                          }}>
                            {p.grade}급
                          </span>
                        </td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>{p.price.toLocaleString()}원</td>
                        <td>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: p.status === 'available' ? 'var(--success-color)' : 'var(--danger-color)'
                          }}>
                            {p.status === 'available' ? '판매중' : '품절 (판매완료)'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => openProductModal(p)} className={styles.btnCancel} style={{ padding: '6px 10px', fontSize: '11px', border: '1px solid var(--text-secondary)' }}>
                              <Edit size={12} /> 수정
                            </button>
                            <button onClick={() => deleteProd(p.id)} className={styles.btnCancel} style={{ padding: '6px 10px', fontSize: '11px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent' }}>
                              <Trash2 size={12} /> 삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 주문 배송 관리 탭 */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>구매 주문 & 배송 관리</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>총 {orders.length}개 결제 내역</span>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>주문 일자</th>
                      <th>주문 기기</th>
                      <th>배송 수령인</th>
                      <th>연락처</th>
                      <th>배송지 주소</th>
                      <th>주문 금액</th>
                      <th>배송 상태 변경</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td>
                          {o.products ? (
                            <span>
                              {o.products.brand} {o.products.model_name}<br />
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {o.products.storage} / {o.products.color} / {o.products.grade}급
                              </span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>삭제된 상품</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{o.shipping_name}</td>
                        <td>{o.shipping_phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</td>
                        <td>{o.shipping_address}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>{o.price.toLocaleString()}원</td>
                        <td>
                          <select 
                            value={o.status}
                            onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                            className={styles.selectStatus}
                            aria-label="배송 상태 변경"
                          >
                            <option value="pending">입금대기 (pending)</option>
                            <option value="shipping">우체국배송중 (shipping)</option>
                            <option value="delivered">배송완료 (delivered)</option>
                            <option value="cancelled">주문취소 (cancelled)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 매입 시세 설정 탭 */}
        {activeTab === 'prices' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>실시간 매입 시세 설정</h2>
              <button onClick={() => openPriceModal(null)} className={styles.btnSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> 신규 매입 기종 등록
              </button>
            </div>

            {/* 필터 및 검색 컨트롤 영역 */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '12px',
              background: '#0f172a',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {/* 제조사 필터 버튼 */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginRight: '4px' }}>제조사:</span>
                  <button 
                    onClick={() => { setPriceFilterBrand('All'); setPriceFilterSub('All'); }}
                    className={priceFilterBrand === 'All' ? styles.btnSave : styles.btnCancel}
                    style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', border: priceFilterBrand === 'All' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    전체보기
                  </button>
                  <button 
                    onClick={() => { setPriceFilterBrand('Apple'); setPriceFilterSub('All'); }}
                    className={priceFilterBrand === 'Apple' ? styles.btnSave : styles.btnCancel}
                    style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', border: priceFilterBrand === 'Apple' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                     Apple
                  </button>
                  <button 
                    onClick={() => { setPriceFilterBrand('Samsung'); setPriceFilterSub('All'); }}
                    className={priceFilterBrand === 'Samsung' ? styles.btnSave : styles.btnCancel}
                    style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', border: priceFilterBrand === 'Samsung' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    SAMSUNG
                  </button>
                </div>

                {/* 검색어 입력 필드 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>기종 검색:</span>
                  <input 
                    type="text"
                    placeholder="예: 아이폰 15"
                    value={priceSearchQuery}
                    onChange={(e) => setPriceSearchQuery(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none',
                      minWidth: '180px'
                    }}
                  />
                </div>
              </div>

              {/* 소분류 필터 (제조사가 전체가 아닐 때만 렌더링) */}
              {priceFilterBrand !== 'All' && (
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'center', 
                  borderTop: '1px solid var(--border-light)', 
                  paddingTop: '10px', 
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginRight: '4px' }}>소분류 시리즈:</span>
                  <button 
                    onClick={() => setPriceFilterSub('All')}
                    className={priceFilterSub === 'All' ? styles.btnSave : styles.btnCancel}
                    style={{ padding: '5px 12px', borderRadius: '15px', fontSize: '12px', border: priceFilterSub === 'All' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    전체 시리즈
                  </button>
                  
                  {priceFilterBrand === 'Apple' && (
                    <>
                      <button 
                        onClick={() => setPriceFilterSub('15')}
                        className={priceFilterSub === '15' ? styles.btnSave : styles.btnCancel}
                        style={{ padding: '5px 12px', borderRadius: '15px', fontSize: '12px', border: priceFilterSub === '15' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                      >
                        아이폰 15 시리즈
                      </button>
                      <button 
                        onClick={() => setPriceFilterSub('14')}
                        className={priceFilterSub === '14' ? styles.btnSave : styles.btnCancel}
                        style={{ padding: '5px 12px', borderRadius: '15px', fontSize: '12px', border: priceFilterSub === '14' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                      >
                        아이폰 14 시리즈
                      </button>
                      <button 
                        onClick={() => setPriceFilterSub('13')}
                        className={priceFilterSub === '13' ? styles.btnSave : styles.btnCancel}
                        style={{ padding: '5px 12px', borderRadius: '15px', fontSize: '12px', border: priceFilterSub === '13' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                      >
                        아이폰 13 시리즈
                      </button>
                    </>
                  )}

                  {priceFilterBrand === 'Samsung' && (
                    <>
                      <button 
                        onClick={() => setPriceFilterSub('S24')}
                        className={priceFilterSub === 'S24' ? styles.btnSave : styles.btnCancel}
                        style={{ padding: '5px 12px', borderRadius: '15px', fontSize: '12px', border: priceFilterSub === 'S24' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                      >
                        갤럭시 S24 시리즈
                      </button>
                      <button 
                        onClick={() => setPriceFilterSub('S23')}
                        className={priceFilterSub === 'S23' ? styles.btnSave : styles.btnCancel}
                        style={{ padding: '5px 12px', borderRadius: '15px', fontSize: '12px', border: priceFilterSub === 'S23' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                      >
                        갤럭시 S23 시리즈
                      </button>
                      <button 
                        onClick={() => setPriceFilterSub('Z')}
                        className={priceFilterSub === 'Z' ? styles.btnSave : styles.btnCancel}
                        style={{ padding: '5px 12px', borderRadius: '15px', fontSize: '12px', border: priceFilterSub === 'Z' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                      >
                        Z 플립/폴드 시리즈
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>브랜드</th>
                      <th>기종 모델명</th>
                      <th>기본가 (256G)</th>
                      <th>128G 감가</th>
                      <th>512G 할증</th>
                      <th>액정 (기스/파손)</th>
                      <th>외관 (찍힘/파손)</th>
                      <th>카메라 고장</th>
                      <th>화면 잔상</th>
                      <th>최종 수정일</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeInPrices
                      .filter(r => priceFilterBrand === 'All' || r.brand.toLowerCase() === priceFilterBrand.toLowerCase())
                      .filter(r => {
                        if (priceFilterSub === 'All') return true;
                        if (priceFilterBrand === 'Apple') {
                          return r.model_name.includes(priceFilterSub);
                        }
                        if (priceFilterBrand === 'Samsung') {
                          if (priceFilterSub === 'Z') {
                            return r.model_name.includes('Z') || r.model_name.includes('플립') || r.model_name.includes('폴드');
                          }
                          return r.model_name.includes(priceFilterSub);
                        }
                        return true;
                      })
                      .filter(r => r.model_name.toLowerCase().includes(priceSearchQuery.toLowerCase()))
                      .map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 'bold' }}>{r.brand}</td>
                          <td style={{ fontWeight: 'bold', color: '#fff' }}>{r.model_name}</td>
                          <td style={{ color: 'var(--success-color)', fontWeight: '600' }}>{r.base_price.toLocaleString()}원</td>
                          <td style={{ color: 'var(--danger-color)' }}>-{r.storage_128g_deduct.toLocaleString()}원</td>
                          <td style={{ color: 'var(--accent-light)' }}>+{r.storage_512g_add.toLocaleString()}원</td>
                          <td>
                            <span style={{ color: 'var(--danger-color)' }}>-{r.screen_scratch_deduct.toLocaleString()}</span> / 
                            <span style={{ color: 'var(--danger-color)', fontWeight: '600' }}> -{r.screen_broken_deduct.toLocaleString()}</span>
                          </td>
                          <td>
                            <span style={{ color: 'var(--danger-color)' }}>-{r.body_scratch_deduct.toLocaleString()}</span> / 
                            <span style={{ color: 'var(--danger-color)', fontWeight: '600' }}> -{r.body_broken_deduct.toLocaleString()}</span>
                          </td>
                          <td style={{ color: 'var(--danger-color)' }}>-{r.camera_error_deduct.toLocaleString()}원</td>
                          <td style={{ color: 'var(--danger-color)' }}>-{r.screen_burn_deduct.toLocaleString()}원</td>
                          <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {new Date(r.updated_at).toLocaleDateString()}
                          </td>
                          <td>
                            <button onClick={() => openPriceModal(r)} className={styles.btnCancel} style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--accent-light)', color: 'var(--accent-light)', backgroundColor: 'transparent' }}>
                              시세 수정
                            </button>
                          </td>
                        </tr>
                      ))}
                    {tradeInPrices
                      .filter(r => priceFilterBrand === 'All' || r.brand.toLowerCase() === priceFilterBrand.toLowerCase())
                      .filter(r => {
                        if (priceFilterSub === 'All') return true;
                        if (priceFilterBrand === 'Apple') {
                          return r.model_name.includes(priceFilterSub);
                        }
                        if (priceFilterBrand === 'Samsung') {
                          if (priceFilterSub === 'Z') {
                            return r.model_name.includes('Z') || r.model_name.includes('플립') || r.model_name.includes('폴드');
                          }
                          return r.model_name.includes(priceFilterSub);
                        }
                        return true;
                      })
                      .filter(r => r.model_name.toLowerCase().includes(priceSearchQuery.toLowerCase())).length === 0 && (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          검색되거나 조건에 부합하는 매입 시세 정보가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 카테고리 관리 탭 */}
        {activeTab === 'categories' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>카테고리(기종) 관리</h2>
              <button onClick={() => openCategoryModal(null)} className={styles.btnSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> 신규 카테고리 추가
              </button>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>기종 썸네일</th>
                      <th>카테고리명</th>
                      <th>등록일</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.id}>
                        <td>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={cat.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150'} 
                            alt={cat.name}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                          />
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#fff' }}>{cat.name}</td>
                        <td>{cat.created_at ? new Date(cat.created_at).toLocaleDateString() : '기본 데이터'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => openCategoryModal(cat)} 
                              className={styles.btnCancel} 
                              style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--accent-light)', color: 'var(--accent-light)', backgroundColor: 'transparent' }}
                            >
                              수정
                            </button>
                            <button 
                              onClick={() => deleteCat(cat.id)} 
                              className={styles.btnCancel} 
                              style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent' }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          등록된 카테고리가 없습니다. [신규 카테고리 추가]를 눌러 첫 카테고리를 등록해보세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 홍콩 재고 관리 탭 */}
        {activeTab === 'hongkong-inventory' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow} style={{ flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className={styles.pageTitle}>{displayLang === 'zh' ? '香港库存管理' : '홍콩 재고 관리'}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {displayLang === 'zh' 
                    ? '查询香港入库设备的状态并进行批量销售处理。' 
                    : '홍콩 입고된 기기의 상태를 조회하고 일괄 판매완료 처리합니다.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className={styles.btnSave}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Plus size={16} /> {displayLang === 'zh' ? '批量导入 (Excel 粘贴)' : '대량 입고 (엑셀 붙여넣기)'}
                </button>
                <button
                  onClick={() => setIsBulkSaleModalOpen(true)}
                  className={styles.btnCancel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid var(--warning-color)',
                    color: 'var(--warning-color)',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                  disabled={hongkongInventory.filter(x => !x.is_sold).length === 0}
                >
                  <CheckCircle2 size={16} /> {displayLang === 'zh' ? '批量销售' : '일괄 판매 처리'}
                </button>
                {selectedHKIds.length > 0 && selectedHKSoldDevicesCount > 0 && (
                  <button
                    onClick={() => executeCancelSales(selectedHKIds.filter(id => {
                      const item = inventoryMap.get(id);
                      return item && item.is_sold;
                    }))}
                    className={styles.btnCancel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid var(--danger-color)',
                      color: 'var(--danger-color)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} /> {displayLang === 'zh' ? `批量取消销售 (${selectedHKSoldDevicesCount}台)` : `선택 판매 취소 (${selectedHKSoldDevicesCount}대)`}
                  </button>
                )}
                {selectedHKIds.length > 0 && (
                  <button
                    onClick={() => executeDeleteHKBatch(selectedHKIds)}
                    className={styles.btnCancel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid var(--danger-color)',
                      color: 'var(--danger-color)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} /> {displayLang === 'zh' ? `批量删除 (${selectedHKIds.length}台)` : `선택 삭제 (${selectedHKIds.length}대)`}
                  </button>
                )}
              </div>
            </div>

            {/* 필터 및 검색 컨트롤 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '12px',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>{displayLang === 'zh' ? '销售状态:' : '판매 상태:'}</span>
                {(['all', 'available', 'sold_pending', 'sold'] as const).map(status => {
                  let label = displayLang === 'zh' ? '全部' : '전체';
                  if (status === 'available') label = displayLang === 'zh' ? '可售' : '판매 가능';
                  if (status === 'sold_pending') label = displayLang === 'zh' ? '待审批' : '승인 대기';
                  if (status === 'sold') label = displayLang === 'zh' ? '已售' : '판매 완료';
                  return (
                    <button
                      key={status}
                      onClick={() => setHkStatusFilter(status)}
                      className={hkStatusFilter === status ? styles.btnSave : styles.btnCancel}
                      style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', border: hkStatusFilter === status ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {/* 보기 방식 토글 추가 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '视图:' : '보기:'}</span>
                  <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden' }}>
                    <button
                      onClick={() => setHkViewMode('list')}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: 0,
                        cursor: 'pointer',
                        backgroundColor: hkViewMode === 'list' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                        color: '#fff',
                        transition: 'all 0.2s'
                      }}
                    >
                      {displayLang === 'zh' ? '列表' : '리스트 표'}
                    </button>
                    <button
                      onClick={() => {
                        setHkViewMode('card');
                        setHkSearchQuery('');
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: 0,
                        cursor: 'pointer',
                        backgroundColor: hkViewMode === 'card' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                        color: '#fff',
                        transition: 'all 0.2s'
                      }}
                    >
                      {displayLang === 'zh' ? '卡片' : '기종 카드'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '搜索:' : '기기 검색:'}</span>
                  <input
                    type="text"
                    placeholder={displayLang === 'zh' ? "串号 / 机型 / 贴纸号" : "IMEI / 모델 / 스티커 번호"}
                    value={hkSearchQuery}
                    onChange={(e) => setHkSearchQuery(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none',
                      minWidth: '200px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 재고 통계 및 선택 정보 바 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '12px',
              fontSize: '13px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--success-color)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  {displayLang === 'zh' ? '汇率' : '홍콩달러 환율'} (Naver): ₩{cnyRate.toFixed(2)}
                </span>
                <span style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                  {displayLang === 'zh' ? '总设备' : '전체 입고 기기'}: <strong style={{ color: '#fff' }}>{hongkongInventory.length}</strong>{displayLang === 'zh' ? '台' : '대'}
                </span>
                <span style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                  {displayLang === 'zh' ? '当前筛选' : '현재 필터 기기'}: <strong style={{ color: 'var(--accent-light)' }}>{filteredHKItems.length}</strong>{displayLang === 'zh' ? '台' : '대'}
                </span>
                <span style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                  {displayLang === 'zh' ? '可售库存' : '판매 가능 재고'}: <strong style={{ color: 'var(--success-color)' }}>{hongkongInventory.filter(x => !x.is_sold).length}</strong>{displayLang === 'zh' ? '台' : '대'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedHKIds.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      {displayLang === 'zh' ? '已选择' : '선택됨'}: <strong>{selectedHKIds.length}</strong>{displayLang === 'zh' ? '台' : '대'}
                    </span>
                    <button
                      onClick={() => setSelectedHKIds([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: '2px 6px'
                      }}
                    >
                      {displayLang === 'zh' ? '取消选择' : '선택 해제'}
                    </button>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {displayLang === 'zh'
                      ? '通过勾选各设备的复选框，可以进行单台 or 批量管理。'
                      : '각 기기의 체크박스를 선택하여 개별 또는 대량 관리가 가능합니다.'}
                  </span>
                )}
              </div>
            </div>

            {hkViewMode === 'card' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
                marginTop: '16px'
              }}>
                {groupedHKModels.map(g => {
                  const displayName = getModelDisplayName(g.modelName);
                  return (
                    <div
                      key={g.modelName}
                      onClick={() => {
                        setHkSearchQuery(g.modelName);
                        setHkViewMode('list');
                      }}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '170px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-light)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <h3 style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#fff',
                            margin: 0,
                            lineHeight: '1.3',
                            maxWidth: '78%'
                          }}>
                            {displayName}
                          </h3>
                          <span style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            whiteSpace: 'nowrap'
                          }}>
                            {g.total}{displayLang === 'zh' ? '台' : '대'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', fontFamily: 'monospace' }}>
                          {g.modelName}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        {g.available > 0 && (
                          <span style={{ color: 'var(--success-color)', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                            {displayLang === 'zh' ? '可售' : '현재고'} <strong>{g.available}</strong>
                          </span>
                        )}
                        {g.pending > 0 && (
                          <span style={{ color: 'var(--warning-color)', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                            {displayLang === 'zh' ? '待批' : '대기'} <strong>{g.pending}</strong>
                          </span>
                        )}
                        {g.sold > 0 && (
                          <span style={{ color: 'var(--text-secondary)', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            {displayLang === 'zh' ? '已售' : '판매'} <strong>{g.sold}</strong>
                          </span>
                        )}
                      </div>

                      <div style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingTop: '8px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        maxHeight: '44px',
                        overflow: 'hidden'
                      }}>
                        {Object.entries(g.colors).map(([color, count]) => (
                          <span
                            key={color}
                            style={{
                              fontSize: '10px',
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              color: 'var(--text-secondary)',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 255, 255, 0.04)'
                            }}
                          >
                            {color} ({count})
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCardBulkSaleModal(g.modelName);
                          }}
                          style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 0.2s'
                          }}
                        >
                          {displayLang === 'zh' ? '整包销售' : '통으로 판매'}
                        </button>
                        
                        <span style={{ fontSize: '11px', color: 'var(--accent-light)', fontWeight: 'bold' }}>
                          {displayLang === 'zh' ? '查看明细 →' : '상세 보기 →'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {groupedHKModels.length === 0 && (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    padding: '60px 40px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {displayLang === 'zh' ? '没有匹配的机型' : '조건에 맞는 기종이 없습니다.'}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          aria-label="전체 선택"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedHKIds(filteredHKItems.map(x => x.id));
                            } else {
                              setSelectedHKIds([]);
                            }
                          }}
                          checked={
                            filteredHKItems.length > 0 &&
                            filteredHKItems.every(x => selectedHKIdsSet.has(x.id))
                          }
                        />
                      </th>
                      <th onClick={() => handleHKSort('site_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {displayLang === 'zh' ? '导入日期' : '입고일'} {renderSortIcon('site_date')}
                      </th>
                      <th onClick={() => handleHKSort('sticker')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {displayLang === 'zh' ? '贴纸' : '스티커'} {renderSortIcon('sticker')}
                      </th>
                      <th onClick={() => handleHKSort('model_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {displayLang === 'zh' ? '机型' : '모델명'} {renderSortIcon('model_name')}
                      </th>
                      <th onClick={() => handleHKSort('imei')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {displayLang === 'zh' ? '串号 (IMEI)' : 'IMEI'} {renderSortIcon('imei')}
                      </th>
                      <th onClick={() => handleHKSort('color')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {displayLang === 'zh' ? '颜色' : '색상'} {renderSortIcon('color')}
                      </th>
                      <th onClick={() => handleHKSort('purchase_cost')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {displayLang === 'zh' ? '成本' : '입고가'} {renderSortIcon('purchase_cost')}
                      </th>
                      <th onClick={() => handleHKSort('selling_price')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {displayLang === 'zh' ? '售价' : '판매가'} {renderSortIcon('selling_price')}
                      </th>
                      <th>{displayLang === 'zh' ? '仓库' : '위치'}</th>
                      <th>{displayLang === 'zh' ? '备注' : '비고'}</th>
                      <th onClick={() => handleHKSort('is_sold')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {displayLang === 'zh' ? '状态' : '상태'} {renderSortIcon('is_sold')}
                      </th>
                      <th>{displayLang === 'zh' ? '操作' : '작업'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHKItems.map(item => (
                      <HKInventoryRow
                        key={item.id}
                        item={item}
                        isChecked={selectedHKIdsSet.has(item.id)}
                        onCheckChange={handleHKCheckChange}
                        getModelDisplayName={getModelDisplayName}
                        cnyRate={cnyRate}
                        onCancelSale={handleCancelSale}
                        onDelete={handleDeleteHK}
                        displayLang={displayLang}
                      />
                    ))}
                    {sortedHKItems.length === 0 && (
                      <tr>
                        <td colSpan={13} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          {displayLang === 'zh' ? '没有香港入库的库存数据。请通过批量导入添加库存。' : '홍콩 입고된 재고 데이터가 없습니다. 대량 입고를 통해 재고를 추가해주세요.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 컨트롤 추가 */}
              {sortedHKItems.length > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {hkPageSize === 'all'
                        ? (displayLang === 'zh' ? `共 ${sortedHKItems.length} 条` : `총 ${sortedHKItems.length}개 표시 중`)
                        : (displayLang === 'zh' 
                          ? `显示 ${(hkPage - 1) * hkPageSize + 1} - ${Math.min(hkPage * hkPageSize, sortedHKItems.length)} 条，共 ${sortedHKItems.length} 条`
                          : `현재 ${(hkPage - 1) * hkPageSize + 1} - ${Math.min(hkPage * hkPageSize, sortedHKItems.length)}개 표시 중 (총 ${sortedHKItems.length}개)`)
                      }
                    </span>
                    <select
                      value={hkPageSize}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHkPageSize(val === 'all' ? 'all' : Number(val));
                      }}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: '#fff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value={50}>50개씩 보기 / 每页 50 条</option>
                      <option value={100}>100개씩 보기 / 每页 100 条</option>
                      <option value={200}>200개씩 보기 / 每页 200 条</option>
                      <option value={500}>500개씩 보기 / 每页 500 条</option>
                      <option value="all">전체보기 / 全部显示</option>
                    </select>
                  </div>
                  {hkPageSize !== 'all' && sortedHKItems.length > hkPageSize && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setHkPage(prev => Math.max(1, prev - 1))}
                        disabled={hkPage === 1}
                        className={styles.btnCancel}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: hkPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: hkPage === 1 ? 0.5 : 1
                        }}
                      >
                        {displayLang === 'zh' ? '上一页' : '이전'}
                      </button>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}>
                        {hkPage} / {Math.ceil(sortedHKItems.length / hkPageSize)}
                      </span>
                      <button
                        onClick={() => setHkPage(prev => Math.min(Math.ceil(sortedHKItems.length / hkPageSize), prev + 1))}
                        disabled={hkPage >= Math.ceil(sortedHKItems.length / hkPageSize)}
                        className={styles.btnCancel}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: hkPage >= Math.ceil(sortedHKItems.length / hkPageSize) ? 'not-allowed' : 'pointer',
                          opacity: hkPage >= Math.ceil(sortedHKItems.length / hkPageSize) ? 0.5 : 1
                        }}
                      >
                        {displayLang === 'zh' ? '下一页' : '다음'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
        )}

        {/* 판매 완료 승인 대기 탭 */}
        {activeTab === 'completed-sales' && (() => {
          const pendingDevices = hongkongInventory.filter(item => item.is_sold && !item.is_approved);
          const pendingRevenue = pendingDevices.reduce((sum, item) => sum + ((Number(item.selling_price) || 0) * cnyRate), 0);
          const pendingCost = pendingDevices.reduce((sum, item) => sum + (Number(item.purchase_cost) || 0), 0);
          const pendingMargin = pendingRevenue - pendingCost;
          const pendingMarginRate = pendingRevenue > 0 ? (pendingMargin / pendingRevenue) * 100 : 0;

          return (
            <div className="animate-fade-in">
              <div className={styles.headerRow}>
                <div>
                  <h2 className={styles.pageTitle}>판매 완료 승인 대기 내역 / 销售完成审批</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    판매원이 판매완료 처리한 기기들을 조회하고, 최종 정산 마진 장부에 넘기기 위해 최종 승인합니다.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => executeFinalApproval(selectedPendingIds)}
                    className={styles.btnSave}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    disabled={selectedPendingIds.length === 0}
                  >
                    <CheckCircle2 size={16} /> 선택 항목 최종 승인 / 最终审批 ({selectedPendingIds.length}건)
                  </button>
                </div>
              </div>

              {/* 승인 대기 지표 요약 카드 */}
              <div className={styles.metricsGrid} style={{ marginBottom: '12px' }}>
                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>승인 대기 수량 / 待审批数量</span>
                    <span className={styles.metricVal}>{pendingDevices.length} 대 / 台</span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}>
                    <Smartphone size={22} />
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>예상 매출 합계 / 预计销售额</span>
                    <span className={styles.metricVal}>₩{Math.round(pendingRevenue).toLocaleString()}</span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                    <Coins size={22} />
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>예상 원가 합계 / 预计成本</span>
                    <span className={styles.metricVal}>₩{Math.round(pendingCost).toLocaleString()}</span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                    <Coins size={22} />
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>예상 마진 & 마진율 / 预计利润 & 利润率</span>
                    <span className={styles.metricVal} style={{ color: pendingMargin >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                      ₩{Math.round(pendingMargin).toLocaleString()} ({pendingMarginRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: pendingMargin >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: pendingMargin >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    <CheckCircle2 size={22} />
                  </div>
                </div>
              </div>

            {/* 필터 및 검색 컨트롤 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '12px',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>승인 상태 / 审批状态:</span>
                {(['all', 'sold_pending', 'sold'] as const).map(status => {
                  let label = '전체 / 全部';
                  if (status === 'sold_pending') label = '최종승인 대기 / 待审批';
                  if (status === 'sold') label = '승인 완료 / 已审批';
                  return (
                    <button
                      key={status}
                      onClick={() => setCompletedSalesFilter(status)}
                      className={completedSalesFilter === status ? styles.btnSave : styles.btnCancel}
                      style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', border: completedSalesFilter === status ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>기기 검색 / 搜索:</span>
                <input
                  type="text"
                  placeholder="IMEI / 모델 / 판매원"
                  value={completedSalesSearch}
                  onChange={(e) => setCompletedSalesSearch(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    minWidth: '200px'
                  }}
                />
              </div>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          aria-label="전체 대기 승인 선택"
                          onChange={(e) => {
                            const pendings = hongkongInventory
                              .filter(item => item.is_sold && !item.is_approved)
                              .filter(item => {
                                const q = completedSalesSearch.toLowerCase();
                                const displayName = getModelDisplayName(item.model_name).toLowerCase();
                                return (
                                  (item.model_name || '').toLowerCase().includes(q) ||
                                  displayName.includes(q) ||
                                  (item.imei || '').toLowerCase().includes(q) ||
                                  (item.seller_name || '').toLowerCase().includes(q)
                                );
                              });
                            if (e.target.checked) {
                              setSelectedPendingIds(pendings.map(x => x.id));
                            } else {
                              setSelectedPendingIds([]);
                            }
                          }}
                          checked={
                            hongkongInventory.filter(item => item.is_sold && !item.is_approved).length > 0 &&
                            hongkongInventory
                              .filter(item => item.is_sold && !item.is_approved)
                              .filter(item => {
                                const q = completedSalesSearch.toLowerCase();
                                const displayName = getModelDisplayName(item.model_name).toLowerCase();
                                return (
                                  (item.model_name || '').toLowerCase().includes(q) ||
                                  displayName.includes(q) ||
                                  (item.imei || '').toLowerCase().includes(q) ||
                                  (item.seller_name || '').toLowerCase().includes(q)
                                );
                              })
                              .every(x => selectedPendingIdsSet.has(x.id))
                          }
                        />
                      </th>
                      <th>판매 일자 / 销售日期</th>
                      <th>판매원 / 销售员</th>
                      <th>모델명 / 机型</th>
                      <th>IMEI / 串号</th>
                      <th>색상 / 颜色</th>
                      <th>입고가 / 成本</th>
                      <th>판매가 / 售价</th>
                      <th>예상 마진 / 预计利润</th>
                      <th>정산 상태 / 结算状态</th>
                      <th>승인 처리 / 审批</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hongkongInventory
                      .filter(item => {
                        if (completedSalesFilter === 'sold_pending') return item.is_sold && !item.is_approved;
                        if (completedSalesFilter === 'sold') return item.is_sold && item.is_approved;
                        return item.is_sold;
                      })
                      .filter(item => {
                        const q = completedSalesSearch.toLowerCase();
                        const displayName = getModelDisplayName(item.model_name).toLowerCase();
                        return (
                          (item.model_name || '').toLowerCase().includes(q) ||
                          displayName.includes(q) ||
                          (item.imei || '').toLowerCase().includes(q) ||
                          (item.seller_name || '').toLowerCase().includes(q)
                        );
                      })
                      .map(item => {
                        const revenueKRW = (Number(item.selling_price) || 0) * cnyRate;
                        const margin = revenueKRW - (Number(item.purchase_cost) || 0);
                        const rate = revenueKRW > 0 ? (margin / revenueKRW) * 100 : 0;
                        return (
                          <tr key={item.id}>
                            <td style={{ textAlign: 'center' }}>
                              {item.is_sold && !item.is_approved ? (
                                <input
                                  type="checkbox"
                                  aria-label={`${item.model_name} 승인 선택`}
                                  checked={selectedPendingIdsSet.has(item.id)}
                                  onChange={(e) => {
                                    const id = item.id;
                                    if (e.target.checked) {
                                      setSelectedPendingIds(prev => [...prev, id]);
                                    } else {
                                      setSelectedPendingIds(prev => prev.filter(x => x !== id));
                                    }
                                  }}
                                />
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>✓</span>
                              )}
                            </td>
                            <td>{item.sale_date || '-'}</td>
                            <td style={{ fontWeight: 'bold' }}>{item.seller_name || '-'}</td>
                            <td style={{ fontWeight: 'bold' }}>{getModelDisplayName(item.model_name)}</td>
                            <td style={{ fontFamily: 'monospace' }}>{item.imei?.startsWith('NO_IMEI-') ? '-' : item.imei}</td>
                            <td>{item.color || '-'}</td>
                            <td>₩{Number(item.purchase_cost || 0).toLocaleString()}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>
                              HK${Number(item.selling_price || 0).toLocaleString()}
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                (₩{Math.round(Number(item.selling_price || 0) * cnyRate).toLocaleString()})
                              </div>
                            </td>
                            <td style={{ color: margin >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                              ₩{Math.round(margin).toLocaleString()}
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                ({rate.toFixed(1)}%)
                              </div>
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                backgroundColor: !item.is_approved ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: !item.is_approved ? 'var(--warning-color)' : 'var(--success-color)'
                              }}>
                                {!item.is_approved ? '최종 승인 대기 / 待审批' : '승인 완료 / 已审批'}
                              </span>
                            </td>
                            <td>
                              {!item.is_approved ? (
                                <button
                                  onClick={() => executeFinalApproval([item.id])}
                                  className={styles.btnSave}
                                  style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                                >
                                  승인 / 审批
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>장부 기재됨</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {hongkongInventory
                      .filter(item => {
                        if (completedSalesFilter === 'sold_pending') return item.is_sold && !item.is_approved;
                        if (completedSalesFilter === 'sold') return item.is_sold && item.is_approved;
                        return item.is_sold;
                      })
                      .filter(item => {
                        const q = completedSalesSearch.toLowerCase();
                        return (
                          (item.model_name || '').toLowerCase().includes(q) ||
                          (item.imei || '').toLowerCase().includes(q) ||
                          (item.seller_name || '').toLowerCase().includes(q)
                        );
                      }).length === 0 && (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          판매 완료 처리된 기기 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          );
        })()}

        {/* 마진 및 정산 탭 */}
        {activeTab === 'margin-settlement' && (() => {
          const settledDevices = hongkongInventory
            .filter(item => item.is_sold && item.is_approved)
            .filter(item => {
              if (settlementSeller !== 'All' && item.seller_name !== settlementSeller) return false;
              const q = settlementSearch.toLowerCase();
              const displayName = getModelDisplayName(item.model_name).toLowerCase();
              return (
                (item.model_name || '').toLowerCase().includes(q) ||
                displayName.includes(q) ||
                (item.imei || '').toLowerCase().includes(q)
              );
            });

          const totalRevenue = settledDevices.reduce((sum, item) => sum + ((Number(item.selling_price) || 0) * cnyRate), 0);
          const totalCost = settledDevices.reduce((sum, item) => sum + (Number(item.purchase_cost) || 0), 0);
          const totalMargin = totalRevenue - totalCost;
          const averageMarginRate = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

          // 판매원 고유 목록 추출
          const sellersList = Array.from(new Set(
            hongkongInventory
              .filter(item => item.is_sold && item.is_approved && item.seller_name)
              .map(item => item.seller_name)
          ));

          return (
            <div className="animate-fade-in">
              <div className={styles.headerRow}>
                <div>
                  <h2 className={styles.pageTitle}>마진 및 정산 관리 / 利润 & 结算</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    최종 승인된 판매 기기들을 기준으로 총 마진액 및 마진율을 실시간 집계합니다. (태국어 비표시)
                  </p>
                </div>
              </div>

              {/* 정산 지표 요약 카드 */}
              <div className={styles.metricsGrid} style={{ marginBottom: '12px' }}>
                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>총 매출액 / 占销售额</span>
                    <span className={styles.metricVal}>₩{totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                    <Coins size={22} />
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>총 원가 / 总成本</span>
                    <span className={styles.metricVal}>₩{totalCost.toLocaleString()}</span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                    <Coins size={22} />
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>총 마진 및 평균 마진율 / 利润 & 利润率</span>
                    <span className={styles.metricVal}>
                      ₩{totalMargin.toLocaleString()} ({averageMarginRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
                    <CheckCircle2 size={22} />
                  </div>
                </div>
              </div>

              {/* 필터 및 검색 컨트롤 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0f172a',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '12px',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>판매원별 필터 / 销售员:</span>
                  <button
                    onClick={() => setSettlementSeller('All')}
                    className={settlementSeller === 'All' ? styles.btnSave : styles.btnCancel}
                    style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', border: settlementSeller === 'All' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    전체 / 全部
                  </button>
                  {sellersList.map(seller => (
                    <button
                      key={seller}
                      onClick={() => setSettlementSeller(seller)}
                      className={settlementSeller === seller ? styles.btnSave : styles.btnCancel}
                      style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', border: settlementSeller === seller ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}
                    >
                      {seller}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>기기 검색 / 搜索:</span>
                  <input
                    type="text"
                    placeholder="IMEI 또는 모델명"
                    value={settlementSearch}
                    onChange={(e) => setSettlementSearch(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none',
                      minWidth: '200px'
                    }}
                  />
                </div>
              </div>

              {/* 상세 마진 테이블 */}
              <div className={styles.tableSection}>
                <div className={styles.tableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>정산일자 / 结算日期</th>
                        <th>판매원 / 销售员</th>
                        <th>모델명 / 机型</th>
                        <th>IMEI / 串号</th>
                        <th>입고원가 / 成本</th>
                        <th>판매가 / 售价</th>
                        <th>순마진 / 利润</th>
                        <th>마진율 / 利润率</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settledDevices.map(item => {
                        const revenueKRW = (Number(item.selling_price) || 0) * cnyRate;
                        const margin = revenueKRW - (Number(item.purchase_cost) || 0);
                        const rate = revenueKRW > 0 ? (margin / revenueKRW) * 100 : 0;
                        return (
                          <tr key={item.id}>
                            <td>{item.sale_date || '-'}</td>
                            <td style={{ fontWeight: 'bold' }}>{item.seller_name || '-'}</td>
                            <td style={{ fontWeight: 'bold' }}>{getModelDisplayName(item.model_name)}</td>
                            <td style={{ fontFamily: 'monospace' }}>{item.imei?.startsWith('NO_IMEI-') ? '-' : item.imei}</td>
                            <td>₩{Number(item.purchase_cost || 0).toLocaleString()}</td>
                            <td style={{ color: 'var(--accent-light)', fontWeight: 'bold' }}>
                              HK${Number(item.selling_price || 0).toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>(₩{Math.round(revenueKRW).toLocaleString()})</span>
                            </td>
                            <td style={{ color: margin >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                              ₩{Math.round(margin).toLocaleString()}
                            </td>
                            <td style={{ color: margin >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                              {rate.toFixed(1)}%
                            </td>
                            <td>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--success-color)'
                              }}>
                                정산확정
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {settledDevices.length === 0 && (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                            정산 조건에 맞는 판매 내역이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 기종 펫네임 관리 탭 */}
        {activeTab === 'model-pet-names' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <div>
                <h2 className={styles.pageTitle}>기종 펫네임 관리 / 型号别称管理</h2>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  모델 코드를 기준으로 한국어와 중국어 펫네임을 관리합니다.
                </span>
              </div>
              <button
                onClick={openAddPetModal}
                className={styles.btnSave}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> 기종 등록 / 新增型号
              </button>
            </div>

            {/* 필터 및 검색 바 */}
            <div className={styles.filterSection} style={{ marginBottom: '16px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: '12px', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <input
                    type="text"
                    placeholder="모델명, 한국어 또는 중국어 펫네임 검색... / 搜索型号或别称..."
                    value={petSearchQuery}
                    onChange={(e) => setPetSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  {petSearchQuery && (
                    <button
                      onClick={() => setPetSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 테이블 목록 */}
            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>No</th>
                      <th>모델 코드 / 型号코드 (기준값)</th>
                      <th>한국어 펫네임 / 韩文别称</th>
                      <th>중국어 펫네임 / 中文别称</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>작업 / 操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const q = petSearchQuery.toLowerCase().trim();
                      const filtered = modelPetNames.filter(x => 
                        (x.model_code || '').toLowerCase().includes(q) ||
                        (x.pet_name_ko || '').toLowerCase().includes(q) ||
                        (x.pet_name_zh || '').toLowerCase().includes(q)
                      );

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                              등록된 기종 펫네임 데이터가 없습니다.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((item, idx) => (
                        <tr key={item.model_code}>
                          <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>{item.model_code}</td>
                          <td>{item.pet_name_ko}</td>
                          <td>{item.pet_name_zh}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => openEditPetModal(item)}
                                className={styles.btnSave}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  color: '#3b82f6',
                                  border: '1px solid rgba(59, 130, 246, 0.2)',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit size={12} style={{ marginRight: '4px' }} /> 수정 / 编辑
                              </button>
                              <button
                                onClick={() => handleDeletePetName(item.model_code)}
                                className={styles.btnCancel}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={12} style={{ marginRight: '4px' }} /> 삭제 / 删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

        {/* 시리즈 자동완성 목록 */}
        <datalist id="series-list">
          {Array.from(new Set(tradeInPrices.map(p => p.series || '').filter(s => s))).map(s => (
            <option key={s} value={s} />
          ))}
        </datalist>

      {/* 3. 모달 - 매입 검수 및 가격 조정 모달 */}
      {isTradeInModalOpen && selectedTradeIn && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>매입 상태 변경 및 가격 조정</h3>
              <button onClick={() => setIsTradeInModalOpen(false)} style={{ color: 'var(--text-secondary)' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>대상 고객</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedTradeIn.members?.name} ({selectedTradeIn.members?.phone_number})</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>기기 모델</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedTradeIn.brand} {selectedTradeIn.model_name} ({selectedTradeIn.storage})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>고객 자가진단 예상가</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-light)' }}>{selectedTradeIn.estimated_price.toLocaleString()}원</span>
              </div>

              {/* 매입 진행 상태 드롭다운 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="tradeInStatusSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>매입 거래 상태</label>
                <select 
                  id="tradeInStatusSelect"
                  value={tradeInStatus} 
                  onChange={(e) => setTradeInStatus(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="pending">신청완료 (pending)</option>
                  <option value="collecting">수거진행중 (collecting)</option>
                  <option value="inspecting">기기검수중 (inspecting)</option>
                  <option value="confirmed">최종견적조정제시 (confirmed)</option>
                  <option value="paid">정산완료 (paid)</option>
                  <option value="cancelled">매입취소/반송 (cancelled)</option>
                </select>
              </div>

              {/* 최종 가격 조정 필드 (confirmed 상태일 때 필수) */}
              {(tradeInStatus === 'confirmed' || tradeInStatus === 'paid') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="finalPriceInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>실물 최종 감정가 (원)</label>
                  <input 
                    id="finalPriceInput"
                    type="number"
                    value={tradeInFinalPrice}
                    onChange={(e) => setTradeInFinalPrice(Number(e.target.value))}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '10px',
                      color: '#fff',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              )}

              {/* 검수 소견 작성 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="adminNotesTextarea" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>검수 평가 소견 (고객 통보용)</label>
                <textarea 
                  id="adminNotesTextarea"
                  rows={3}
                  value={tradeInAdminNotes}
                  onChange={(e) => setTradeInAdminNotes(e.target.value)}
                  placeholder="예: 액정 모서리 실기스 확인 및 카메라 렌즈 잔기스로 인해 5만원 차감함."
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px',
                    color: '#fff',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
            </div>

            <div className={styles.btnGroup}>
              <button onClick={() => setIsTradeInModalOpen(false)} className={styles.btnCancel}>닫기</button>
              <button onClick={saveTradeInChanges} className={styles.btnSave}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 모달 - 상품 신규 등록 / 수정 모달 */}
      {isProductModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                {selectedProduct ? '중고폰 상품 정보 수정' : '중고폰 판매 상품 등록'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} style={{ color: 'var(--text-secondary)' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="prodCategorySelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>기종 카테고리</label>
                  <select 
                    id="prodCategorySelect"
                    value={prodCategory} 
                    onChange={(e) => setProdCategory(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="brandSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>제조사</label>
                  <select 
                    id="brandSelect"
                    value={prodBrand} 
                    onChange={(e) => setProdBrand(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    <option>Apple</option>
                    <option>Samsung</option>
                    <option>LG</option>
                    <option>Lenovo</option>
                    <option>Google</option>
                    <option>기타</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="prodSeriesInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>시리즈</label>
                  <input 
                    id="prodSeriesInput"
                    type="text" 
                    placeholder="예: 15 시리즈, 맥북 시리즈"
                    value={prodSeries} 
                    onChange={(e) => setProdSeries(e.target.value)}
                    list="series-list"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="gradeSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>안심 등급</label>
                  <select 
                    id="gradeSelect"
                    value={prodGrade} 
                    onChange={(e) => setProdGrade(e.target.value as 'S' | 'A' | 'B')}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    <option>S</option>
                    <option>A</option>
                    <option>B</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="modelNameInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>모델 명칭</label>
                <input 
                  id="modelNameInput"
                  type="text" 
                  placeholder="예: 아이폰 15 프로"
                  value={prodModelName} 
                  onChange={(e) => setProdModelName(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="storageSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>용량 스펙</label>
                  <select 
                    id="storageSelect"
                    value={prodStorage} 
                    onChange={(e) => setProdStorage(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    <option>128GB</option>
                    <option>256GB</option>
                    <option>512GB</option>
                    <option>1TB</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="colorInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>색상</label>
                  <input 
                    id="colorInput"
                    type="text" 
                    placeholder="예: 내추럴 티타늄"
                    value={prodColor} 
                    onChange={(e) => setProdColor(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="priceInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>판매 금액 (원)</label>
                <input 
                  id="priceInput"
                  type="number" 
                  placeholder="예: 1150000"
                  value={prodPrice} 
                  onChange={(e) => setProdPrice(Number(e.target.value))}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="prodBatteryInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>배터리 효율</label>
                  <input 
                    id="prodBatteryInput"
                    type="text" 
                    placeholder="예: 95%, 100%, 96% 이상"
                    value={prodBattery} 
                    onChange={(e) => setProdBattery(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="prodCarrierInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>통신사 정보</label>
                  <input 
                    id="prodCarrierInput"
                    type="text" 
                    placeholder="예: 3사 공용, SKT, 자급제"
                    value={prodCarrier} 
                    onChange={(e) => setProdCarrier(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="imageFileInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>기기 사진 업로드</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {prodImage ? (
                    <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={prodImage} 
                        alt="미리보기" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setProdImage('')}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          backgroundColor: 'rgba(239, 68, 68, 0.8)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        title="사진 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      border: '2px dashed var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      lineHeight: '1.2'
                    }}>
                      사진 없음
                    </div>
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <input 
                      id="imageFileInput"
                      type="file" 
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="imageFileInput"
                      style={{
                        display: 'inline-block',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '10px 16px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {uploadingImage ? '이미지 압축 및 업로드 중...' : '기기 사진 선택'}
                    </label>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      * 모바일에 적합하도록 가로/세로 800px로 자동 조절되어 저장됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="descriptionTextarea" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>상품 코멘트 설명글</label>
                <textarea 
                  id="descriptionTextarea"
                  rows={3} 
                  placeholder="외관 스크래치 상태, 배터리 효율 정보 등을 입력해주세요."
                  value={prodDescription} 
                  onChange={(e) => setProdDescription(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff', resize: 'none' }}
                />
              </div>
            </div>

            <div className={styles.btnGroup}>
              <button onClick={() => setIsProductModalOpen(false)} className={styles.btnCancel}>취소</button>
              <button onClick={saveProduct} className={styles.btnSave}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 모달 - 매입 시세 수정 및 신규 등록 모달 */}
      {isPriceModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                {selectedPriceRule ? '매입 기종 시세 및 차감률 수정' : '신규 매입 기종 등록'}
              </h3>
              <button onClick={() => setIsPriceModalOpen(false)} style={{ color: 'var(--text-secondary)' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleCategorySelect" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>기종 카테고리</label>
                  <select 
                    id="ruleCategorySelect"
                    value={ruleCategory} 
                    onChange={(e) => setRuleCategory(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleBrandSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>제조사</label>
                  <select 
                    id="ruleBrandSelect"
                    value={ruleBrand} 
                    onChange={(e) => setRuleBrand(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    <option>Apple</option>
                    <option>Samsung</option>
                    <option>LG</option>
                    <option>Lenovo</option>
                    <option>Google</option>
                    <option>기타</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleSeriesInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>시리즈</label>
                  <input 
                    id="ruleSeriesInput"
                    type="text" 
                    placeholder="예: 15 시리즈, 맥북 시리즈"
                    value={ruleSeries} 
                    onChange={(e) => setRuleSeries(e.target.value)}
                    list="series-list"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleModelNameInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>기종 명칭</label>
                  <input 
                    id="ruleModelNameInput"
                    type="text" 
                    placeholder="예: 아이폰 15 프로"
                    value={ruleModelName} 
                    onChange={(e) => setRuleModelName(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                    disabled={!!selectedPriceRule} // 기종명은 식별자로 사용되므로 수정 모드일 때 비활성화
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleBasePriceInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>기본 매입가 (256G)</label>
                  <input 
                    id="ruleBasePriceInput"
                    type="number" 
                    value={ruleBasePrice} 
                    onChange={(e) => setRuleBasePrice(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleStorage128gDeductInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>128GB 감가액 (-)</label>
                  <input 
                    id="ruleStorage128gDeductInput"
                    type="number" 
                    value={ruleStorage128gDeduct} 
                    onChange={(e) => setRuleStorage128gDeduct(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleStorage512gAddInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>512GB 가산액 (+)</label>
                  <input 
                    id="ruleStorage512gAddInput"
                    type="number" 
                    value={ruleStorage512gAdd} 
                    onChange={(e) => setRuleStorage512gAdd(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleScreenScratchDeductInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>액정 미세 흠집 감가액 (-)</label>
                  <input 
                    id="ruleScreenScratchDeductInput"
                    type="number" 
                    value={ruleScreenScratchDeduct} 
                    onChange={(e) => setRuleScreenScratchDeduct(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleScreenBrokenDeductInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>액정 파손/깨짐 감가액 (-)</label>
                  <input 
                    id="ruleScreenBrokenDeductInput"
                    type="number" 
                    value={ruleScreenBrokenDeduct} 
                    onChange={(e) => setRuleScreenBrokenDeduct(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleBodyScratchDeductInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>테두리 미세 찍힘 감가액 (-)</label>
                  <input 
                    id="ruleBodyScratchDeductInput"
                    type="number" 
                    value={ruleBodyScratchDeduct} 
                    onChange={(e) => setRuleBodyScratchDeduct(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleBodyBrokenDeductInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>외관 심한 파손 감가액 (-)</label>
                  <input 
                    id="ruleBodyBrokenDeductInput"
                    type="number" 
                    value={ruleBodyBrokenDeduct} 
                    onChange={(e) => setRuleBodyBrokenDeduct(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleCameraErrorDeductInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>카메라 고장/렌즈손상 감가액 (-)</label>
                  <input 
                    id="ruleCameraErrorDeductInput"
                    type="number" 
                    value={ruleCameraErrorDeduct} 
                    onChange={(e) => setRuleCameraErrorDeduct(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="ruleScreenBurnDeductInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>화면 잔상(Burn-in) 감가액 (-)</label>
                  <input 
                    id="ruleScreenBurnDeductInput"
                    type="number" 
                    value={ruleScreenBurnDeduct} 
                    onChange={(e) => setRuleScreenBurnDeduct(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.btnGroup}>
              <button onClick={() => setIsPriceModalOpen(false)} className={styles.btnCancel}>취소</button>
              <button onClick={savePriceRule} className={styles.btnSave}>저장하기</button>
            </div>
          </div>
        </div>
      )}
      {/* 6. 모달 - 카테고리 등록 및 수정 모달 */}
      {isCategoryModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                {selectedCategory ? '카테고리 정보 수정' : '신규 카테고리 추가'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} style={{ color: 'var(--text-secondary)' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid} style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="catNameInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>카테고리 이름</label>
                <input 
                  id="catNameInput"
                  type="text" 
                  placeholder="예: 스마트폰, 태블릿, 노트북..."
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>카테고리 대표 이미지</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '4px' }}>
                  {catImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={catImage} 
                      alt="미리보기" 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                    />
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px dashed var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      lineHeight: '1.2'
                    }}>
                      사진 없음
                    </div>
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <input 
                      id="catImageFileInput"
                      type="file" 
                      accept="image/*"
                      onChange={handleCategoryFileChange}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="catImageFileInput"
                      style={{
                        display: 'inline-block',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '10px 16px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {uploadingCatImage ? '업로드 중...' : '사진 선택'}
                    </label>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      * 원형 아이콘으로 사용될 이미지를 등록해 주세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.btnGroup} style={{ marginTop: '20px' }}>
              <button onClick={() => setIsCategoryModalOpen(false)} className={styles.btnCancel}>취소</button>
              <button onClick={saveCategory} className={styles.btnSave}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 홍콩 재고 대량 가져오기 모달 */}
      {isImportModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '800px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                홍콩 재고 대량 입고 / 批量导入库存 (Excel / Sheets Paste)
              </h3>
              <button onClick={() => {
                setIsImportModalOpen(false);
                setPasteText('');
                setDetectedHeaders([]);
                setParsedImportRows([]);
              }} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="bulkPasteTextarea" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  엑셀(Excel) 또는 스프레드시트의 행 데이터를 아래에 붙여넣으세요. (첫 줄 헤더 포함)
                </label>
                <textarea
                  id="bulkPasteTextarea"
                  rows={6}
                  placeholder="예시:&#10;Sticker&#9;Date&#9;Model&#9;IMEI&#9;Color&#9;Cost&#9;Price&#9;Location&#9;Notes&#10;SN001&#9;24-06-10&#9;아이폰 15&#9;35829381&#9;Black&#9;450&#9;550&#9;HK-A&#9;Test"
                  value={pasteText}
                  onChange={(e) => handlePasteChange(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {detectedHeaders.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px', color: 'var(--accent-light)' }}>
                    가져올 열 항목 선택 / 导入列选择 (체크 시 데이터 반영, 해제 시 빈 값 처리)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {[
                      { field: 'pgNo', label: 'P/G No (Sticker)' },
                      { field: 'modelName', label: '모델명' },
                      { field: 'petName', label: '펫네임' },
                      { field: 'imei', label: 'IMEI' },
                      { field: 'color', label: '색상' },
                      { field: 'sellPrice', label: '실판매가 (판매가)' },
                      { field: 'deductionItem', label: '차감항목' }
                    ].map(cfg => (
                      <label 
                        key={cfg.field} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '8px 12px', 
                          background: importFields[cfg.field] ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255,255,255,0.02)',
                          borderRadius: '6px',
                          border: importFields[cfg.field] ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        <input 
                          type="checkbox"
                          checked={importFields[cfg.field] !== false}
                          onChange={(e) => {
                            const updated = { ...importFields, [cfg.field]: e.target.checked };
                            setImportFields(updated);
                            recalculateParsedRows(pasteText, updated);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: '500', color: importFields[cfg.field] ? '#fff' : 'var(--text-secondary)' }}>
                          {cfg.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {parsedImportRows.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                    파싱 미리보기 / 数据预览 (총 {parsedImportRows.length}행 중 상위 5개 미리보기)
                  </span>
                  <div className={styles.tableSection}>
                    <div className={styles.tableWrapper}>
                      <table className={styles.adminTable} style={{ fontSize: '11px' }}>
                        <thead>
                          <tr>
                            <th>스티커</th>
                            <th>입고일</th>
                            <th>모델명</th>
                            <th>IMEI</th>
                            <th>색상</th>
                            <th>원가</th>
                            <th>판매가</th>
                            <th>위치</th>
                            <th>비고</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedImportRows.slice(0, 5).map((r, idx) => (
                            <tr key={idx}>
                              <td>{r.sticker}</td>
                              <td>{r.site_date}</td>
                              <td style={{ fontWeight: 'bold' }}>{getModelDisplayName(r.model_name)}</td>
                              <td style={{ fontFamily: 'monospace' }}>{r.imei || '-'}</td>
                              <td>{r.color}</td>
                              <td>{r.purchase_cost ? `₩${(Number(String(r.purchase_cost).replace(/[^0-9.-]/g, '')) || 0).toLocaleString()}` : '-'}</td>
                              <td>{r.selling_price ? `HK$${(Number(String(r.selling_price).replace(/[^0-9.-]/g, '')) || 0).toLocaleString()}` : '-'}</td>
                              <td>{r.stock_location}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{r.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.btnGroup}>
              <button onClick={() => {
                setIsImportModalOpen(false);
                setPasteText('');
                setDetectedHeaders([]);
                setParsedImportRows([]);
              }} className={styles.btnCancel}>닫기</button>
              <button
                onClick={executeImport}
                className={styles.btnSave}
                disabled={parsedImportRows.length === 0}
              >
                가져오기 실행 / 确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 판매 처리 모달 */}
      {isBulkSaleModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                일괄 판매 처리 / 批量销售
              </h3>
              <button onClick={() => setIsBulkSaleModalOpen(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="bulkSellerNameInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>판매원 이름 / 销售员 (필수)</label>
                  <input
                    id="bulkSellerNameInput"
                    type="text"
                    placeholder="예: 홍길동"
                    value={bulkSellerName}
                    onChange={(e) => setBulkSellerName(e.target.value)}
                    disabled
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="bulkSaleDateInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>판매 일자 / 销售日期 (필수)</label>
                  <input
                    id="bulkSaleDateInput"
                    type="date"
                    value={bulkSaleDate}
                    onChange={(e) => setBulkSaleDate(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    required
                  />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                  판매할 기종 및 미판매 제외 선택 / 选择销售기종 및 未售出 排除
                </span>
                
                <div style={{
                  maxHeight: '280px',
                  overflowY: 'auto',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {(() => {
                    const availableHKDevices = hongkongInventory.filter(x => !x.is_sold);
                    const groupedHKDevices: Record<string, typeof availableHKDevices> = {};
                    availableHKDevices.forEach(item => {
                      if (!groupedHKDevices[item.model_name]) {
                        groupedHKDevices[item.model_name] = [];
                      }
                      groupedHKDevices[item.model_name].push(item);
                    });

                    const groups = Object.entries(groupedHKDevices);
                    if (groups.length === 0) {
                      return <span style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>판매 가능한 재고가 없습니다.</span>;
                    }

                    return groups.map(([modelName, items]) => {
                      const isModelSelected = selectedBulkModels.includes(modelName);
                      const isExpanded = expandedBulkModels[modelName];

                      return (
                        <div key={modelName} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                <input
                                  type="checkbox"
                                  checked={isModelSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedBulkModels([...selectedBulkModels, modelName]);
                                    } else {
                                      setSelectedBulkModels(selectedBulkModels.filter(m => m !== modelName));
                                      const modelDeviceIds = items.map(x => x.id);
                                      setUnsoldBulkDeviceIds(unsoldBulkDeviceIds.filter(id => !modelDeviceIds.includes(id)));
                                      // Clear price
                                      const updatedPrices = { ...bulkSellingPrices };
                                      delete updatedPrices[modelName];
                                      setBulkSellingPrices(updatedPrices);
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: isModelSelected ? '#fff' : 'var(--text-secondary)' }}>
                                  {getModelDisplayName(modelName)} ({items.length}대)
                                </span>
                              </label>

                              {/* 기종별 판매단가 입력란 */}
                              {isModelSelected && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>판매단가:</span>
                                  <input
                                    type="number"
                                    placeholder="단가 (HK$)"
                                    value={bulkSellingPrices[modelName] || ''}
                                    onChange={(e) => setBulkSellingPrices({ ...bulkSellingPrices, [modelName]: e.target.value })}
                                    style={{
                                      backgroundColor: 'var(--bg-tertiary)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '4px',
                                      padding: '4px 8px',
                                      color: '#fff',
                                      fontSize: '12px',
                                      width: '100px',
                                      outline: 'none'
                                    }}
                                    required
                                  />
                                  <span style={{ fontSize: '11px', color: 'var(--accent-light)' }}>HK$</span>
                                </div>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setExpandedBulkModels({ ...expandedBulkModels, [modelName]: !isExpanded })}
                              style={{
                                fontSize: '11px',
                                color: 'var(--accent-light)',
                                cursor: 'pointer',
                                background: 'none',
                                border: 'none',
                                outline: 'none'
                              }}
                            >
                              {isExpanded ? '접기 ▲' : '기기 상세 ▼'}
                            </button>
                          </div>

                          {isExpanded && (
                            <div style={{ paddingLeft: '22px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {items.map(dev => {
                                const isUnsold = unsoldBulkDeviceIds.includes(dev.id);
                                return (
                                  <label
                                    key={dev.id}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      fontSize: '11px',
                                      padding: '6px 10px',
                                      backgroundColor: isUnsold ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.01)',
                                      borderRadius: '4px',
                                      border: isUnsold ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid transparent',
                                      opacity: isModelSelected ? 1 : 0.5,
                                      cursor: isModelSelected ? 'pointer' : 'default',
                                      userSelect: 'none'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <input
                                        type="checkbox"
                                        disabled={!isModelSelected}
                                        checked={isUnsold}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setUnsoldBulkDeviceIds([...unsoldBulkDeviceIds, dev.id]);
                                          } else {
                                            setUnsoldBulkDeviceIds(unsoldBulkDeviceIds.filter(id => id !== dev.id));
                                          }
                                        }}
                                        style={{ cursor: isModelSelected ? 'pointer' : 'default' }}
                                      />
                                      <span style={{ color: isUnsold ? 'var(--warning-color)' : '#fff', fontWeight: isUnsold ? 'bold' : 'normal' }}>
                                        {isUnsold ? '★ 미판매 제외 / 排除未售' : '판매 완료 / 确认销售'}
                                      </span>
                                    </div>
                                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                      {dev.color ? `${dev.color} | ` : ''}Sticker: {dev.sticker || '-'} | IMEI: {dev.imei?.startsWith('NO_IMEI-') ? '-' : dev.imei}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            <div className={styles.btnGroup}>
              <button onClick={() => setIsBulkSaleModalOpen(false)} className={styles.btnCancel}>취소</button>
              <button
                onClick={executeBulkSale}
                className={styles.btnSave}
                disabled={processingBulkSale || selectedBulkModels.length === 0}
              >
                {processingBulkSale ? '판매 처리 중...' : '판매 처리 실행 / 确认销售'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 펫네임 추가/수정 모달 */}
      {isPetModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                {selectedPet ? '기종 펫네임 수정 / 编辑型号别称' : '기종 펫네임 등록 / 新增型号别称'}
              </h3>
              <button 
                onClick={() => setIsPetModalOpen(false)} 
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }} 
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePetName} className={styles.formGrid} style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="petModelCodeInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  모델 코드 / 型号代码 (예: SM-F956, F956)
                </label>
                <input
                  id="petModelCodeInput"
                  type="text"
                  placeholder="예: SM-F956"
                  value={petModelCode}
                  onChange={(e) => setPetModelCode(e.target.value)}
                  disabled={!!selectedPet}
                  style={{ 
                    backgroundColor: selectedPet ? 'var(--bg-secondary)' : 'var(--bg-tertiary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '6px', 
                    padding: '10px', 
                    color: selectedPet ? 'var(--text-secondary)' : '#fff',
                    cursor: selectedPet ? 'not-allowed' : 'text'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="petNameKoInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  한국어 펫네임 / 韩文别称
                </label>
                <input
                  id="petNameKoInput"
                  type="text"
                  placeholder="예: 갤럭시 Z폴드6"
                  value={petNameKo}
                  onChange={(e) => setPetNameKo(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="petNameZhInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  중국어 펫네임 / 中文别称
                </label>
                <input
                  id="petNameZhInput"
                  type="text"
                  placeholder="예: 三星 Z Fold6"
                  value={petNameZh}
                  onChange={(e) => setPetNameZh(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  required
                />
              </div>

              <div className={styles.btnGroup} style={{ marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsPetModalOpen(false)} 
                  className={styles.btnCancel}
                >
                  취소 / 取消
                </button>
                <button
                  type="submit"
                  className={styles.btnSave}
                  disabled={savingPetName}
                >
                  {savingPetName ? '저장 중...' : '저장 / 保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 카드 기종 일괄 판매 모달 */}
      {cardBulkSaleModel && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '650px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                {displayLang === 'zh' ? '기종 통으로 판매 (整包销售)' : '기종 통으로 판매'}
              </h3>
              <button onClick={() => setCardBulkSaleModel(null)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 기종 정보 및 판매 설정 */}
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>
                  {getModelDisplayName(cardBulkSaleModel)}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>판매원 이름 / 销售员</label>
                    <input
                      type="text"
                      value={bulkSellerName}
                      disabled
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>판매 일자 / 销售日期</label>
                    <input
                      type="date"
                      value={cardBulkSaleDate}
                      onChange={(e) => setCardBulkSaleDate(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>기종별 판매단가 / 销售单价 (HKD)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="예: 2500"
                      value={cardBulkUnitPrice}
                      onChange={(e) => setCardBulkUnitPrice(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff', flex: 1 }}
                    />
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>HK$</span>
                  </div>
                </div>
              </div>

              {/* 고속 제외 스캐너/키패드 입력부 */}
              <div 
                onClick={() => stickerInputRef.current?.focus()}
                style={{ cursor: 'text', padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#60a5fa' }}>
                  {displayLang === 'zh' ? '输入贴纸号排除 (5位数字)' : '제외할 스티커 번호 입력 (5자리 입력 시 즉시 제외)'}
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    ref={stickerInputRef}
                    type="text"
                    placeholder="스티커 5자리 입력 (예: 01234)"
                    value={stickerInput}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setStickerInput(val);
                      
                      if (val.length === 5) {
                        const availableHKDevices = hongkongInventory.filter(x => x.model_name === cardBulkSaleModel && !x.is_sold);
                        const match = availableHKDevices.find(d => d.sticker && d.sticker.endsWith(val) && !excludedDeviceIds.has(d.id));
                        if (match) {
                          setExcludedDeviceIds(prev => {
                            const next = new Set(prev);
                            next.add(match.id);
                            return next;
                          });
                          setLastActionMsg(`제외 완료: 스티커 ${match.sticker || val}`);
                        } else {
                          const alreadyExcluded = availableHKDevices.find(d => d.sticker && d.sticker.endsWith(val) && excludedDeviceIds.has(d.id));
                          if (alreadyExcluded) {
                            setLastActionMsg(`이미 제외됨: 스티커 ${alreadyExcluded.sticker || val}`);
                          } else {
                            setLastActionMsg(`찾을 수 없음: 스티커 ${val}`);
                          }
                        }
                        setStickerInput('');
                      }
                    }}
                    autoFocus
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '2px solid #2563eb',
                      borderRadius: '6px',
                      padding: '12px',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      letterSpacing: '3px',
                      textAlign: 'center',
                      width: '200px',
                      outline: 'none'
                    }}
                  />
                  {lastActionMsg && (
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: lastActionMsg.startsWith('제외') ? 'var(--success-color)' : 'var(--danger-color)',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      padding: '6px 12px',
                      borderRadius: '4px'
                    }}>
                      {lastActionMsg}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  * 오른쪽 키패드나 바코드 스캐너에서 엔터 없이 5자리 숫자만 빠르게 연달아 입력하여 고속으로 기기를 제외할 수 있습니다.
                </span>
              </div>

              {/* 통계 요약 */}
              {(() => {
                const availableHKDevices = hongkongInventory.filter(x => x.model_name === cardBulkSaleModel && !x.is_sold);
                const excludedDevices = availableHKDevices.filter(x => excludedDeviceIds.has(x.id));
                const soldDevices = availableHKDevices.filter(x => !excludedDeviceIds.has(x.id));
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', fontSize: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>대상 기기</span>
                      <strong style={{ fontSize: '14px', color: '#fff' }}>{availableHKDevices.length}대</strong>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <span style={{ color: 'var(--success-color)', display: 'block', marginBottom: '2px' }}>판매 완료 처리</span>
                      <strong style={{ fontSize: '14px', color: 'var(--success-color)' }}>{soldDevices.length}대</strong>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                      <span style={{ color: 'var(--warning-color)', display: 'block', marginBottom: '2px' }}>제외됨 (재고 유지)</span>
                      <strong style={{ fontSize: '14px', color: 'var(--warning-color)' }}>{excludedDevices.length}대</strong>
                    </div>
                  </div>
                );
              })()}

              {/* 제외된 기기 상세 리스트 및 제외 해제 */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '8px' }}>
                  제외된 기기 목록 / 已排除的设备 列表 ({hongkongInventory.filter(x => x.model_name === cardBulkSaleModel && !x.is_sold && excludedDeviceIds.has(x.id)).length}대)
                </span>
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {(() => {
                    const availableHKDevices = hongkongInventory.filter(x => x.model_name === cardBulkSaleModel && !x.is_sold);
                    const excludedDevices = availableHKDevices.filter(x => excludedDeviceIds.has(x.id));
                    if (excludedDevices.length === 0) {
                      return <span style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '10px 0' }}>제외된 기기가 없습니다.</span>;
                    }
                    return excludedDevices.map(dev => (
                      <div key={dev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '4px', fontSize: '11px' }}>
                        <span>
                          <strong style={{ color: 'var(--warning-color)' }}>[제외됨]</strong> Sticker: <strong>{dev.sticker || '-'}</strong> | {dev.color} | IMEI: {dev.imei?.startsWith('NO_IMEI-') ? '-' : dev.imei}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExcludedDeviceIds(prev => {
                              const next = new Set(prev);
                              next.delete(dev.id);
                              return next;
                            });
                            setLastActionMsg(`복구 완료: 스티커 ${dev.sticker}`);
                            setTimeout(() => stickerInputRef.current?.focus(), 50);
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--accent-light)',
                            border: 'none',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          복구 / 恢复
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className={styles.btnGroup} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
              <button onClick={() => setCardBulkSaleModel(null)} className={styles.btnCancel}>취소</button>
              <button
                onClick={executeCardBulkSale}
                className={styles.btnSave}
                disabled={processingBulkSale}
                style={{ minWidth: '120px' }}
              >
                {processingBulkSale ? '판매 처리 중...' : '판매 처리 실행 / 确认销售'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
