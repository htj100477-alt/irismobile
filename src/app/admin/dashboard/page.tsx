'use client';

import { useState, useEffect } from 'react';
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

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'trade-ins' | 'products' | 'orders' | 'prices' | 'categories' | 'hongkong-inventory' | 'completed-sales' | 'margin-settlement'>('home');
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
  
  // 일괄 판매 처리 상태
  const [bulkSaleDate, setBulkSaleDate] = useState('');
  const [bulkSellerName, setBulkSellerName] = useState('');
  const [bulkRemainingInput, setBulkRemainingInput] = useState('');
  const [processingBulkSale, setProcessingBulkSale] = useState(false);
  const [selectedBulkModels, setSelectedBulkModels] = useState<string[]>([]);
  const [unsoldBulkDeviceIds, setUnsoldBulkDeviceIds] = useState<string[]>([]);
  const [expandedBulkModels, setExpandedBulkModels] = useState<Record<string, boolean>>({});

  // 신규 탭 검색, 필터링 및 선택 상태
  const [hkStatusFilter, setHkStatusFilter] = useState<'all' | 'available' | 'sold_pending' | 'sold'>('all');
  const [hkSearchQuery, setHkSearchQuery] = useState('');
  const [hkSortColumn, setHkSortColumn] = useState<string | null>(null);
  const [hkSortDirection, setHkSortDirection] = useState<'asc' | 'desc'>('asc');
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

  // 홍콩 재고 필터링 리스트 계산
  const filteredHKItems = hongkongInventory
    .filter(item => {
      if (hkStatusFilter === 'available') return !item.is_sold;
      if (hkStatusFilter === 'sold_pending') return item.is_sold && !item.is_approved;
      if (hkStatusFilter === 'sold') return item.is_sold && item.is_approved;
      return true;
    })
    .filter(item => {
      const q = hkSearchQuery.toLowerCase();
      return (
        (item.model_name || '').toLowerCase().includes(q) ||
        (item.imei || '').toLowerCase().includes(q) ||
        (item.sticker || '').toLowerCase().includes(q)
      );
    });

  // 홍콩 재고 정렬 리스트 계산
  const sortedHKItems = [...filteredHKItems].sort((a, b) => {
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
  });
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
  const loadAllData = async () => {
    setLoading(true);
    try {
      // 모든 API 요청을 병렬(Parallel)로 동시에 시작하여 로딩 시간 단축
      const [tradeRes, prodRes, orderRes, priceRes, catRes, hkRes] = await Promise.all([
        fetch('/api/trade-ins'),
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/trade-in-prices'),
        fetch('/api/categories'),
        fetch('/api/hongkong-inventory')
      ]);

      // 응답 JSON 파싱도 병렬로 처리
      const [tradeData, prodData, orderData, priceData, catData, hkData] = await Promise.all([
        tradeRes.json(),
        prodRes.json(),
        orderRes.json(),
        priceRes.json(),
        catRes.json(),
        hkRes.json()
      ]);

      if (tradeData.success) setTradeIns(tradeData.data);
      if (prodData.success) setProducts(prodData.data);
      if (orderData.success) setOrders(orderData.data);
      if (priceData.success) setTradeInPrices(priceData.data);
      if (catData.success) setCategories(catData.data);
      if (hkData.success) setHongkongInventory(hkData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      
      // 1. 모델명 & 펫네임 조합
      let mName = '';
      if (fields.petName && petIdx < row.length && row[petIdx]) {
        mName = row[petIdx];
      }
      if (fields.modelName && modelIdx < row.length && row[modelIdx]) {
        mName = mName ? `${mName} (${row[modelIdx]})` : row[modelIdx];
      }
      item.model_name = mName || '기형 미확인 / 未知型号';

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
    const validRecords = parsedImportRows.filter(r => r.imei && r.model_name);
    if (validRecords.length === 0) {
      alert('유효한 모델명과 IMEI를 가진 행이 없습니다.');
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

    const availableHKDevices = hongkongInventory.filter(x => !x.is_sold);
    const candidateDevices = availableHKDevices.filter(x => selectedBulkModels.includes(x.model_name));
    const soldDevices = candidateDevices.filter(x => !unsoldBulkDeviceIds.includes(x.id));
    const unsoldDevices = candidateDevices.filter(x => unsoldBulkDeviceIds.includes(x.id));

    if (soldDevices.length === 0) {
      alert('선택한 기종 중 판매 완료할 기기가 없습니다. 모든 기기가 미판매로 제외되었습니다.');
      return;
    }

    const confirmMsg = `선택하신 기종(${selectedBulkModels.join(', ')}) 총 ${candidateDevices.length}대 중\n` +
      `- 판매 완료 처리: ${soldDevices.length}대\n` +
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
        setBulkSellerName('');
        setBulkSaleDate('');
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
  const executeDeleteHK = async (id: string) => {
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
  };

  // 홍콩 재고 판매 취소
  const executeCancelSales = async (deviceIds: string[]) => {
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
        setSelectedHKIds(selectedHKIds.filter(id => !deviceIds.includes(id)));
        loadAllData();
      } else {
        alert(data.error || '판매 취소 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

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
            onClick={() => setActiveTab('hongkong-inventory')}
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
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '20px'
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
            <div className={styles.headerRow}>
              <div>
                <h2 className={styles.pageTitle}>홍콩 재고 관리 / 香港库存管理</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  홍콩 입고된 기기의 상태를 조회하고 일괄 판매완료 처리합니다.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className={styles.btnSave}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Plus size={16} /> 대량 입고 (엑셀 붙여넣기) / 批量导入
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
                  <CheckCircle2 size={16} /> 일괄 판매 처리 / 批量销售
                </button>
                {selectedHKIds.length > 0 && hongkongInventory.filter(x => selectedHKIds.includes(x.id) && x.is_sold).length > 0 && (
                  <button
                    onClick={() => executeCancelSales(selectedHKIds.filter(id => {
                      const item = hongkongInventory.find(x => x.id === id);
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
                    <X size={16} /> 선택 판매 취소 / 批量取消销售 ({hongkongInventory.filter(x => selectedHKIds.includes(x.id) && x.is_sold).length}대)
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
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '16px',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>판매 상태 / 销售状态:</span>
                {(['all', 'available', 'sold_pending', 'sold'] as const).map(status => {
                  let label = '전체 / 全部';
                  if (status === 'available') label = '판매 가능 / 可售';
                  if (status === 'sold_pending') label = '승인 대기 / 待审批';
                  if (status === 'sold') label = '판매 완료 / 已售';
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>기기 검색 / 搜索:</span>
                <input
                  type="text"
                  placeholder="IMEI / 모델 / 스티커 번호"
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

            {/* 재고 통계 및 선택 정보 바 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
              fontSize: '13px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                <span>
                  전체 입고 기기 / 总设备: <strong style={{ color: '#fff' }}>{hongkongInventory.length}</strong>대
                </span>
                <span style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                  현재 필터 기기 / 当前筛选: <strong style={{ color: 'var(--accent-light)' }}>{filteredHKItems.length}</strong>대
                </span>
                <span style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                  판매 가능 재고 / 可售库存: <strong style={{ color: 'var(--success-color)' }}>{hongkongInventory.filter(x => !x.is_sold).length}</strong>대
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedHKIds.length > 0 ? (
                  <span style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    선택됨 / 已선택: <strong>{selectedHKIds.length}</strong>대
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    각 기기의 체크박스를 선택하여 개별 또는 대량 관리가 가능합니다.
                  </span>
                )}
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
                            filteredHKItems.every(x => selectedHKIds.includes(x.id))
                          }
                        />
                      </th>
                      <th onClick={() => handleHKSort('site_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        입고일 / 导入日期 {renderSortIcon('site_date')}
                      </th>
                      <th onClick={() => handleHKSort('sticker')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        스티커 / 贴纸 {renderSortIcon('sticker')}
                      </th>
                      <th onClick={() => handleHKSort('model_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        모델명 / 机型 {renderSortIcon('model_name')}
                      </th>
                      <th onClick={() => handleHKSort('imei')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        IMEI / 串号 {renderSortIcon('imei')}
                      </th>
                      <th onClick={() => handleHKSort('color')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        색상 / 颜色 {renderSortIcon('color')}
                      </th>
                      <th onClick={() => handleHKSort('battery_pct')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        배터리 / 电池 {renderSortIcon('battery_pct')}
                      </th>
                      <th onClick={() => handleHKSort('purchase_cost')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        입고가 / 成本 {renderSortIcon('purchase_cost')}
                      </th>
                      <th onClick={() => handleHKSort('selling_price')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        판매가 / 售价 {renderSortIcon('selling_price')}
                      </th>
                      <th>위치 / 仓库</th>
                      <th>비고 / 备注</th>
                      <th onClick={() => handleHKSort('is_sold')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        상태 / 状态 {renderSortIcon('is_sold')}
                      </th>
                      <th>작업 / 操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHKItems.map(item => (
                      <tr key={item.id}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            aria-label={`${item.model_name} 선택`}
                            checked={selectedHKIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedHKIds([...selectedHKIds, item.id]);
                              } else {
                                setSelectedHKIds(selectedHKIds.filter(id => id !== item.id));
                              }
                            }}
                          />
                        </td>
                        <td>{item.site_date}</td>
                        <td>{item.sticker || '-'}</td>
                        <td style={{ fontWeight: 'bold' }}>{item.model_name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.imei}</td>
                        <td>{item.color || '-'}</td>
                        <td>{item.battery_pct}%</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          ₩{(item.purchase_cost || 0).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>
                          ₩{(item.selling_price || 0).toLocaleString()}
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
                              ? '판매 가능 / 可售'
                              : !item.is_approved
                                ? '승인 대기 / 待审批'
                                : '판매 완료 / 已售'}
                          </span>
                        </td>
                        <td>
                          {item.is_sold && (
                            <button
                              onClick={() => executeCancelSales([item.id])}
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
                              판매 취소 / 取消销售
                            </button>
                          )}
                          <button
                            onClick={() => executeDeleteHK(item.id)}
                            className={styles.btnCancel}
                            style={{ padding: '6px 10px', fontSize: '11px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent', cursor: 'pointer' }}
                          >
                            삭제 / 删除
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedHKItems.length === 0 && (
                      <tr>
                        <td colSpan={13} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          홍콩 입고된 재고 데이터가 없습니다. 대량 입고를 통해 재고를 추가해주세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 판매 완료 승인 대기 탭 */}
        {activeTab === 'completed-sales' && (
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

            {/* 필터 및 검색 컨트롤 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
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
                                return (
                                  (item.model_name || '').toLowerCase().includes(q) ||
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
                                return (
                                  (item.model_name || '').toLowerCase().includes(q) ||
                                  (item.imei || '').toLowerCase().includes(q) ||
                                  (item.seller_name || '').toLowerCase().includes(q)
                                );
                              })
                              .every(x => selectedPendingIds.includes(x.id))
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
                        return (
                          (item.model_name || '').toLowerCase().includes(q) ||
                          (item.imei || '').toLowerCase().includes(q) ||
                          (item.seller_name || '').toLowerCase().includes(q)
                        );
                      })
                      .map(item => (
                        <tr key={item.id}>
                          <td style={{ textAlign: 'center' }}>
                            {item.is_sold && !item.is_approved ? (
                              <input
                                type="checkbox"
                                aria-label={`${item.model_name} 승인 선택`}
                                checked={selectedPendingIds.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPendingIds([...selectedPendingIds, item.id]);
                                  } else {
                                    setSelectedPendingIds(selectedPendingIds.filter(id => id !== item.id));
                                  }
                                }}
                              />
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>✓</span>
                            )}
                          </td>
                          <td>{item.sale_date || '-'}</td>
                          <td style={{ fontWeight: 'bold' }}>{item.seller_name || '-'}</td>
                          <td style={{ fontWeight: 'bold' }}>{item.model_name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{item.imei}</td>
                          <td>{item.color || '-'}</td>
                          <td>₩{(item.purchase_cost || 0).toLocaleString()}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>
                            ₩{(item.selling_price || 0).toLocaleString()}
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
                      ))}
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
                        <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          판매 완료 처리된 기기 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 마진 및 정산 탭 */}
        {activeTab === 'margin-settlement' && (() => {
          const settledDevices = hongkongInventory
            .filter(item => item.is_sold && item.is_approved)
            .filter(item => {
              if (settlementSeller !== 'All' && item.seller_name !== settlementSeller) return false;
              const q = settlementSearch.toLowerCase();
              return (
                (item.model_name || '').toLowerCase().includes(q) ||
                (item.imei || '').toLowerCase().includes(q)
              );
            });

          const totalRevenue = settledDevices.reduce((sum, item) => sum + (item.selling_price || 0), 0);
          const totalCost = settledDevices.reduce((sum, item) => sum + (item.purchase_cost || 0), 0);
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
              <div className={styles.metricsGrid} style={{ marginBottom: '20px' }}>
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
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '20px',
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
                        const margin = (item.selling_price || 0) - (item.purchase_cost || 0);
                        const rate = item.selling_price > 0 ? (margin / item.selling_price) * 100 : 0;
                        return (
                          <tr key={item.id}>
                            <td>{item.sale_date || '-'}</td>
                            <td style={{ fontWeight: 'bold' }}>{item.seller_name || '-'}</td>
                            <td style={{ fontWeight: 'bold' }}>{item.model_name}</td>
                            <td style={{ fontFamily: 'monospace' }}>{item.imei}</td>
                            <td>₩{(item.purchase_cost || 0).toLocaleString()}</td>
                            <td style={{ color: 'var(--accent-light)', fontWeight: 'bold' }}>
                              ₩{(item.selling_price || 0).toLocaleString()}
                            </td>
                            <td style={{ color: margin >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                              ₩{margin.toLocaleString()}
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
                  placeholder="예시:&#10;Sticker&#9;Date&#9;Model&#9;IMEI&#9;Color&#9;Battery&#9;Cost&#9;Price&#9;Location&#9;Notes&#10;SN001&#9;24-06-10&#9;아이폰 15&#9;35829381&#9;Black&#9;98&#9;450&#9;550&#9;HK-A&#9;Test"
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
                            <th>배터리</th>
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
                              <td style={{ fontWeight: 'bold' }}>{r.model_name}</td>
                              <td style={{ fontFamily: 'monospace' }}>{r.imei}</td>
                              <td>{r.color}</td>
                              <td>{r.battery_pct ? `${String(r.battery_pct).replace(/[^0-9]/g, '')}%` : '-'}</td>
                              <td>{r.purchase_cost ? `₩${(Number(String(r.purchase_cost).replace(/[^0-9.-]/g, '')) || 0).toLocaleString()}` : '-'}</td>
                              <td>{r.selling_price ? `₩${(Number(String(r.selling_price).replace(/[^0-9.-]/g, '')) || 0).toLocaleString()}` : '-'}</td>
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
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: isModelSelected ? '#fff' : 'var(--text-secondary)' }}>
                                {modelName} ({items.length}대)
                              </span>
                            </label>
                            
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
                                      {dev.color ? `${dev.color} | ` : ''}Sticker: {dev.sticker || '-'} | IMEI: {dev.imei}
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

    </div>
  );
}
