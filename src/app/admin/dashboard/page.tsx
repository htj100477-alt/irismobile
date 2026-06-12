'use client';

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Smartphone, ShoppingBag, ClipboardList, LogOut, CheckCircle2, AlertCircle, Plus, Edit, Trash2, X, Coins, Settings, Layers, Menu, Users, MinusCircle, XCircle } from 'lucide-react';
import styles from '@/styles/admin.module.css';

// 대한민국 행정구역 데이터 (도/시 및 시/군/구 매핑)
const KOREA_ADDRESS_DATA: Record<string, string[]> = {
  '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산광역시': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
  '대구광역시': ['군위군', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
  '인천광역시': ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'],
  '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
  '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
  '세종특별자치시': ['세종시'],
  '경기도': ['가평군', '고양시 덕양구', '고양시 일산동구', '고양시 일산서구', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시 분당구', '성남시 수정구', '성남시 중원구', '수원시 권선구', '수원시 영통구', '수원시 장안구', '수원시 팔달구', '시흥시', '안산시 단원구', '안산시 상록구', '안성시', '안양시 동안구', '안양시 만안구', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시 기흥구', '용인시 수지구', '용인시 처인구', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
  '강원특별자치도': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  '충청북도': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시 상당구', '청주시 서원구', '청주시 청원구', '청주시 흥덕구', '충주시'],
  '충청남도': ['계룡시', '공주시', '금산군', '논산시', '당진시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시 동남구', '천안시 서북구', '청양군', '태안군', '홍성군'],
  '전북특별자치도': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시 덕진구', '전주시 완산구', '정읍시', '진안군'],
  '전라남도': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
  '경상북도': ['경산시', '경주시', '고령군', '구미시', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시 남구', '포항시 북구'],
  '경상남도': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시 마산합포구', '창원시 마산회원구', '창원시 성산구', '창원시 의창구', '창원시 진해구', '통영시', '하동군', '함안군', '함양군', '합천군'],
  '제주특별자치도': ['서귀포시', '제주시']
};

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

const getYearMonth = (dateStr: string) => {
  if (!dateStr) return '기타/날짜없음';
  const clean = dateStr.replace(/\s+/g, '').replace(/-/g, '.');
  const parts = clean.split('.');
  if (parts.length >= 2) {
    let year = parts[0];
    let month = parts[1];
    if (year.startsWith('20')) year = year.slice(2);
    if (month.length === 1) month = '0' + month;
    return `20${year}-${month}`;
  }
  return '기타/날짜없음';
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
  onUpdateGrade: (id: string, newGrade: string) => void;
  onEditClick: (item: any) => void;
}

const HKInventoryRow = memo(function HKInventoryRow({
  item,
  isChecked,
  onCheckChange,
  getModelDisplayName,
  cnyRate,
  onCancelSale,
  onDelete,
  displayLang,
  onUpdateGrade,
  onEditClick
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
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
          (HK${Math.round((Number(item.purchase_cost) || 0) / cnyRate).toLocaleString()})
        </span>
      </td>
      <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>
        HK${Number(item.selling_price || 0).toLocaleString()}
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '4px' }}>
          (₩{Math.round(Number(item.selling_price || 0) * (Number(item.sale_rate) || cnyRate)).toLocaleString()})
        </span>
      </td>
      <td>{item.stock_location || '-'}</td>
      <td>
        <select
          value={item.notes || ''}
          onChange={(e) => onUpdateGrade(item.id, e.target.value)}
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '4px 8px',
            color: '#fff',
            fontSize: '11px',
            cursor: 'pointer',
            outline: 'none',
            width: '100%',
            maxWidth: '90px'
          }}
        >
          <option value="">{displayLang === 'zh' ? '无' : '공란'}</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="LCD">LCD</option>
          {item.notes && !['A', 'B', 'C', 'D', 'LCD'].includes(item.notes) && (
            <option value={item.notes}>{item.notes}</option>
          )}
        </select>
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
        {/* 개별 기기 정보 수정 버튼 */}
        <button
          onClick={() => onEditClick(item)}
          className={styles.btnSave}
          style={{
            padding: '6px 10px',
            fontSize: '11px',
            border: '1px solid var(--accent-light)',
            color: 'var(--accent-light)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          {displayLang === 'zh' ? '编辑' : '수정'}
        </button>
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
    prevProps.getModelDisplayName === nextProps.getModelDisplayName &&
    prevProps.onUpdateGrade === nextProps.onUpdateGrade
  );
});

interface MemberRowProps {
  member: any;
  onUpdate: (
    id: string, 
    name: string, 
    pin: string, 
    role: string, 
    address_province?: string, 
    address_city?: string, 
    address_detail?: string
  ) => void;
  onDelete: (id: string, name: string) => void;
  displayLang: 'ko' | 'zh';
}

const MemberRow = memo(function MemberRow({ member, onUpdate, onDelete, displayLang }: MemberRowProps) {
  const [name, setName] = useState(member.name);
  const [pin, setPin] = useState(member.pin_code);
  const [role, setRole] = useState(member.role || 'general');
  const [province, setProvince] = useState(member.address_province || '');
  const [city, setCity] = useState(member.address_city || '');
  const [detail, setDetail] = useState(member.address_detail || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      alert(displayLang === 'zh' ? '姓名不能为空' : '이름을 입력해주세요.');
      return;
    }
    if (pin.length !== 4 || isNaN(Number(pin))) {
      alert(displayLang === 'zh' ? 'PIN 必须是4位数字' : 'PIN 번호는 4자리 숫자여야 합니다.');
      return;
    }
    onUpdate(member.id, name, pin, role, province, city, detail);
    setIsEditing(false);
  };

  return (
    <tr>
      <td style={{ padding: '14px 16px' }}>
        {isEditing ? (
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '13px',
              width: '120px'
            }}
          />
        ) : (
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{member.name}</span>
        )}
      </td>
      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px' }}>
        {member.phone_number.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        {isEditing ? (
          <input 
            type="password" 
            value={pin} 
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} 
            maxLength={4}
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '13px',
              width: '80px',
              textAlign: 'center',
              letterSpacing: '2px'
            }}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>••••</span>
        )}
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        {isEditing ? (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="admin">{displayLang === 'zh' ? '管理员' : '어드민'}</option>
            <option value="manager">{displayLang === 'zh' ? '经理' : '매니저'}</option>
            <option value="staff">{displayLang === 'zh' ? '职员' : '스탭'}</option>
            <option value="general">{displayLang === 'zh' ? '普通会员' : '일반회원'}</option>
          </select>
        ) : (
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            backgroundColor: 
              role === 'admin' ? 'rgba(239, 68, 68, 0.1)' :
              role === 'manager' ? 'rgba(245, 158, 11, 0.1)' :
              role === 'staff' ? 'rgba(95, 93, 236, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            color: 
              role === 'admin' ? 'var(--danger-color)' :
              role === 'manager' ? 'var(--warning-color)' :
              role === 'staff' ? 'var(--accent-light)' : 'var(--text-secondary)'
          }}>
            {role === 'admin' ? (displayLang === 'zh' ? '어드민' : '어드민') :
             role === 'manager' ? (displayLang === 'zh' ? '매니저' : '매니저') :
             role === 'staff' ? (displayLang === 'zh' ? '스탭' : '스탭') : (displayLang === 'zh' ? '일반' : '일반')}
          </span>
        )}
      </td>
      {/* 주소 정보 표시/수정 셀 */}
      <td style={{ padding: '14px 16px', fontSize: '13px' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setCity('');
                }}
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '12px',
                  width: '110px',
                  cursor: 'pointer'
                }}
              >
                <option value="">도/시 선택</option>
                {Object.keys(KOREA_ADDRESS_DATA).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province}
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '12px',
                  width: '110px',
                  cursor: 'pointer'
                }}
              >
                <option value="">시/군/구 선택</option>
                {province && KOREA_ADDRESS_DATA[province]?.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder={displayLang === 'zh' ? '详细地址' : '상세주소'}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#fff',
                fontSize: '12px',
                width: '226px'
              }}
            />
          </div>
        ) : (
          <span>{member.address_province ? `${member.address_province} ${member.address_city} ${member.address_detail}` : '-'}</span>
        )}
      </td>
      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
        {new Date(member.created_at).toLocaleDateString()}
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {isEditing ? (
            <>
              <button 
                onClick={handleSave}
                style={{
                  backgroundColor: 'var(--accent-light)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {displayLang === 'zh' ? '保存' : '저장'}
              </button>
              <button 
                onClick={() => {
                  setName(member.name);
                  setPin(member.pin_code);
                  setRole(member.role || 'general');
                  setProvince(member.address_province || '');
                  setCity(member.address_city || '');
                  setDetail(member.address_detail || '');
                  setIsEditing(false);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '5px 12px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {displayLang === 'zh' ? '取消' : '취소'}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '5px 12px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Edit size={12} /> {displayLang === 'zh' ? '编辑' : '수정'}
              </button>
              <button 
                onClick={() => onDelete(member.id, member.name)}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: 'var(--danger-color)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={12} /> {displayLang === 'zh' ? '删除' : '삭제'}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.member.id === nextProps.member.id &&
    prevProps.member.name === nextProps.member.name &&
    prevProps.member.phone_number === nextProps.member.phone_number &&
    prevProps.member.pin_code === nextProps.member.pin_code &&
    prevProps.member.role === nextProps.member.role &&
    prevProps.member.address_province === nextProps.member.address_province &&
    prevProps.member.address_city === nextProps.member.address_city &&
    prevProps.member.address_detail === nextProps.member.address_detail &&
    prevProps.member.created_at === nextProps.member.created_at &&
    prevProps.displayLang === nextProps.displayLang
  );
});

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  admin: {
    home: true,
    'trade-ins': true,
    products: true,
    orders: true,
    prices: true,
    categories: true,
    'hongkong-inventory': true,
    'completed-sales': true,
    'margin-settlement': true,
    'model-pet-names': true,
    deductions: true,
    scanner: true,
    permissions: true,
    members: true
  },
  manager: {
    home: true,
    'trade-ins': true,
    products: true,
    orders: true,
    prices: false,
    categories: false,
    'hongkong-inventory': true,
    'completed-sales': true,
    'margin-settlement': true,
    'model-pet-names': true,
    deductions: true,
    scanner: true,
    permissions: false,
    members: false
  },
  staff: {
    home: true,
    'trade-ins': true,
    products: false,
    orders: false,
    prices: false,
    categories: false,
    'hongkong-inventory': true,
    'completed-sales': false,
    'margin-settlement': false,
    'model-pet-names': false,
    deductions: false,
    scanner: true,
    permissions: false,
    members: false
  },
  general: {
    home: true,
    'trade-ins': false,
    products: false,
    orders: false,
    prices: false,
    categories: false,
    'hongkong-inventory': false,
    'completed-sales': false,
    'margin-settlement': false,
    'model-pet-names': false,
    deductions: false,
    scanner: true,
    permissions: false,
    members: false
  }
};

const MENU_KEYS = [
  { key: 'home', label: '대시보드 홈 / 控制台' },
  { key: 'trade-ins', label: '매입 신청 관리 / 回收订单' },
  { key: 'products', label: '판매 상품 관리 / 商品管理' },
  { key: 'orders', label: '주문 배송 관리 / 订单发货' },
  { key: 'prices', label: '매입 시세 설정 / 回收报价' },
  { key: 'categories', label: '카테고리 관리 / 分类管理' },
  { key: 'hongkong-inventory', label: '홍콩 재고 관리 / 香港库存' },
  { key: 'completed-sales', label: '판매 승인 / 销售审批' },
  { key: 'margin-settlement', label: '마진 및 정산 / 利润结算' },
  { key: 'model-pet-names', label: '기종 펫네임 관리 / 型号别称' },
  { key: 'members', label: '회원 등급 관리 / 会员管理' },
  { key: 'scanner', label: '바코드 스캐너 / 扫码销售' },
  { key: 'permissions', label: '메뉴 권한 설정 / 权限管理' }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'trade-ins' | 'products' | 'orders' | 'prices' | 'categories' | 'hongkong-inventory' | 'completed-sales' | 'margin-settlement' | 'model-pet-names' | 'permissions' | 'members' | 'deduction-rules'>('home');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'staff' | 'general'>('admin');
  
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_menu_permissions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const merged = { ...DEFAULT_PERMISSIONS };
          Object.keys(merged).forEach(role => {
            merged[role] = { ...merged[role], ...parsed[role] };
          });
          return merged;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return DEFAULT_PERMISSIONS;
  });

  const [tempPermissions, setTempPermissions] = useState<Record<string, Record<string, boolean>>>(permissions);

  // 권한 설정 탭 진입 시 임시 상태 동기화
  useEffect(() => {
    if (activeTab === 'permissions') {
      setTempPermissions(permissions);
    }
  }, [activeTab, permissions]);

  const handlePermissionChange = (role: string, menuKey: string, checked: boolean) => {
    setTempPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [menuKey]: checked
      }
    }));
  };

  const handleSavePermissions = async () => {
    try {
      const roles = ['admin', 'manager', 'staff', 'general'];
      const responses = await Promise.all(roles.map(role => 
        fetch('/api/permissions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, permissions: tempPermissions[role] })
        })
      ));
      
      const failed = responses.find(r => !r.ok);
      if (failed) {
        const errData = await failed.json();
        throw new Error(errData.error || 'API 저장 실패');
      }
      
      localStorage.setItem('admin_menu_permissions', JSON.stringify(tempPermissions));
      setPermissions(tempPermissions);
      alert(displayLang === 'zh' ? '权限设置已保存！' : '권한 설정이 저장되었습니다!');
    } catch (e: any) {
      console.error(e);
      alert((displayLang === 'zh' ? '保存失败: ' : '권한 저장 실패: ') + (e.message || ''));
    }
  };

  const handleResetPermissions = () => {
    if (confirm(displayLang === 'zh' ? '确定要恢复为默认权限设置吗？' : '기본 권한 설정으로 복원하시겠습니까?')) {
      setTempPermissions(DEFAULT_PERMISSIONS);
    }
  };

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
  const [members, setMembers] = useState<any[]>([]);
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
  const [hkStatusFilter, setHkStatusFilter] = useState<'all' | 'available' | 'sold_pending' | 'sold'>('available');
  const [hkSearchQuery, setHkSearchQuery] = useState('');
  const [hkSortColumn, setHkSortColumn] = useState<string | null>(null);
  const [hkSortDirection, setHkSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hkStorageFilter, setHkStorageFilter] = useState('all');
  const [settleSortColumn, setSettleSortColumn] = useState<string | null>(null);
  const [settleSortDirection, setSettleSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editDeviceOpen, setEditDeviceOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);
  const [editingSticker, setEditingSticker] = useState('');
  const [editingModelName, setEditingModelName] = useState('');
  const [editingStorage, setEditingStorage] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [editingBattery, setEditingBattery] = useState('');
  const [editingCost, setEditingCost] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [savingDevice, setSavingDevice] = useState(false);
  const [cnyRate, setCnyRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hkd_krw_exchange_rate');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return 175;
  }); // 추가: 홍콩달러 환율

  const formatCurrency = useCallback((value: number, from: 'KRW' | 'HKD' = 'KRW') => {
    if (from === 'KRW') {
      if (displayLang === 'zh') {
        const hkd = value / cnyRate;
        return `HK${Math.round(hkd).toLocaleString()}`;
      }
      return `₩${Math.round(value).toLocaleString()}`;
    } else {
      if (displayLang === 'zh') {
        return `HK${Math.round(value).toLocaleString()}`;
      }
      const krw = value * cnyRate;
      return `₩${Math.round(krw).toLocaleString()}`;
    }
  }, [displayLang, cnyRate]);

  const getDayFromDateStr = useCallback((dateStr: string) => {
    if (!dateStr) return null;
    const clean = dateStr.replace(/\s+/g, '').replace(/\./g, '-');
    const parts = clean.split('-').filter(Boolean);
    if (parts.length >= 3) {
      const day = parseInt(parts[2], 10);
      if (!isNaN(day)) return day;
    }
    return null;
  }, []);

  const getDaysInMonth = useCallback((monthStr: string) => {
    if (!monthStr || monthStr === 'All') return 31;
    const parts = monthStr.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      return new Date(year, month, 0).getDate();
    }
    return 31;
  }, []);
  

  // 홍콩 재고 페이지네이션 상태
  const [hkPage, setHkPage] = useState(1);
  const [hkPageSize, setHkPageSize] = useState<number | 'all'>(50);
  const [hkViewMode, setHkViewMode] = useState<'list' | 'card'>('list');
  const [settlementViewMode, setSettlementViewMode] = useState<'list' | 'card'>('list');
  const [hkCardSortMode, setHkCardSortMode] = useState<'count' | 'name'>('count');
  const [settlementCardSortMode, setSettlementCardSortMode] = useState<'count' | 'name' | 'margin'>('count');

  // 승인 대기 / 완료 판매 정보 수정 모달 상태
  const [editSaleModalOpen, setEditSaleModalOpen] = useState(false);
  const [editSaleDevice, setEditSaleDevice] = useState<any | null>(null);
  const [editSalePrice, setEditSalePrice] = useState('');
  const [editSaleDate, setEditSaleDate] = useState('');
  const [editSellerName, setEditSellerName] = useState('');

  // 차감 내역 수정 모달 상태
  const [editDeductionModalOpen, setEditDeductionModalOpen] = useState(false);
  const [editDeductionItem, setEditDeductionItem] = useState<any | null>(null);
  const [editDeductionNameKo, setEditDeductionNameKo] = useState('');
  const [editDeductionNameZh, setEditDeductionNameZh] = useState('');
  const [editDeductionQty, setEditDeductionQty] = useState('');
  const [editDeductionAmountHkd, setEditDeductionAmountHkd] = useState('');

  // 기종 카드 일괄 가격 수정 모달 상태
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditCard, setBulkEditCard] = useState<any | null>(null);
  const [bulkEditPrice, setBulkEditPrice] = useState('');

  // 검색/필터 변경 시 페이지 1로 리셋
  useEffect(() => {
    setHkPage(1);
  }, [hkStatusFilter, hkSearchQuery, hkSortColumn, hkSortDirection, hkPageSize, hkViewMode]);

  // 정산 월 변경 시 정산 일 필터 초기화
  // 기종 카드 일괄 판매 상태
  const [cardBulkSaleModel, setCardBulkSaleModel] = useState<string | null>(null);
  const [excludedDeviceIds, setExcludedDeviceIds] = useState<Set<string>>(new Set());
  const [stickerInput, setStickerInput] = useState('');
  const [cardBulkUnitPrice, setCardBulkUnitPrice] = useState('');
  const [cardBulkSaleDate, setCardBulkSaleDate] = useState('');
  const [lastActionMsg, setLastActionMsg] = useState('');
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const [cardBulkSaleGrades, setCardBulkSaleGrades] = useState<string[] | null>(null);
  const stickerTimeoutRef = useRef<any>(null);

  const processExclusion = useCallback((val: string) => {
    if (!val) return;
    const cleanVal = val.trim();
    if (!cleanVal) return;

    const targetModelNames = new Set<string>();
    if (cardBulkSaleModel) {
      targetModelNames.add(cardBulkSaleModel.trim().toUpperCase());
      for (const [modelCode, petInfo] of petNameMap.entries()) {
        if (
          petInfo.ko.trim() === cardBulkSaleModel.trim() ||
          petInfo.zh.trim() === cardBulkSaleModel.trim()
        ) {
          targetModelNames.add(modelCode.toUpperCase());
          if (modelCode.toUpperCase().startsWith('SM-')) {
            targetModelNames.add(modelCode.toUpperCase().substring(3));
          } else {
            targetModelNames.add('SM-' + modelCode.toUpperCase());
          }
        }
      }
    }

    const availableHKDevices = hongkongInventory.filter(x => {
      const modelClean = (x.model_name || '').trim().toUpperCase();
      const isModelMatch = targetModelNames.has(modelClean) || 
        (modelClean.startsWith('SM-') && targetModelNames.has(modelClean.substring(3))) ||
        (!modelClean.startsWith('SM-') && targetModelNames.has('SM-' + modelClean));

      return (
        isModelMatch && 
        !x.is_sold &&
        (!cardBulkSaleGrades || cardBulkSaleGrades.length === 0 || cardBulkSaleGrades.includes(x.notes?.trim() || (displayLang === 'zh' ? '无' : '공란')))
      );
    });

    // 1. 아직 제외되지 않은 기기 중에서 매칭 시도 (우선 매칭)
    const match = availableHKDevices.find(d => {
      if (excludedDeviceIds.has(d.id)) return false; // 이미 제외된 기기는 제외하고 찾음

      const imeiClean = d.imei ? d.imei.trim() : '';
      const stickerClean = d.sticker ? d.sticker.trim() : '';

      if (imeiClean && imeiClean === cleanVal) return true;
      if (stickerClean && stickerClean === cleanVal) return true;
      if (imeiClean && cleanVal.length >= 4 && imeiClean.endsWith(cleanVal)) return true;
      if (stickerClean && stickerClean.endsWith(cleanVal)) return true;
      return false;
    });

    if (match) {
      setExcludedDeviceIds(prev => {
        const next = new Set(prev);
        next.add(match.id);
        return next;
      });
      // 스티커와 IMEI 정보를 모두 상세히 노출하여 오해가 없도록 함
      const stickerPart = match.sticker ? match.sticker : '-';
      const imeiPart = (match.imei && !match.imei.startsWith('NO_IMEI-')) ? match.imei : '-';
      setLastActionMsg(`제외 완료: 스티커 ${stickerPart} (IMEI: ${imeiPart})`);
    } else {
      // 2. 이미 제외된 기기 중에서 동일한 입력이 있는지 확인
      const alreadyExcluded = availableHKDevices.find(d => {
        if (!excludedDeviceIds.has(d.id)) return false;

        const imeiClean = d.imei ? d.imei.trim() : '';
        const stickerClean = d.sticker ? d.sticker.trim() : '';

        if (imeiClean && imeiClean === cleanVal) return true;
        if (stickerClean && stickerClean === cleanVal) return true;
        if (imeiClean && cleanVal.length >= 4 && imeiClean.endsWith(cleanVal)) return true;
        if (stickerClean && stickerClean.endsWith(cleanVal)) return true;
        return false;
      });

      if (alreadyExcluded) {
        const stickerPart = alreadyExcluded.sticker ? alreadyExcluded.sticker : '-';
        const imeiPart = (alreadyExcluded.imei && !alreadyExcluded.imei.startsWith('NO_IMEI-')) ? alreadyExcluded.imei : '-';
        setLastActionMsg(`이미 제외됨: 스티커 ${stickerPart} (IMEI: ${imeiPart})`);
      } else {
        setLastActionMsg(`찾을 수 없음: ${cleanVal}`);
      }
    }
    setStickerInput('');
  }, [hongkongInventory, cardBulkSaleModel, cardBulkSaleGrades, displayLang, excludedDeviceIds]);
  const [modalSelectedGrades, setModalSelectedGrades] = useState<string[]>([]);
  const [cardBulkSaleGradeSelection, setCardBulkSaleGradeSelection] = useState<{
    modelName: string;
    grades: string[];
  } | null>(null);

  const [completedSalesSearch, setCompletedSalesSearch] = useState('');

  // 차감 항목 관련 상태
  const [bulkSaleDeductions, setBulkSaleDeductions] = useState<any[]>([]);
  const [bulkSaleDeductionQuantities, setBulkSaleDeductionQuantities] = useState<Record<string, number>>({});

  // 수동 차감 입력 상태
  const [customDeductionName, setCustomDeductionName] = useState('');
  const [customDeductionAmountHkd, setCustomDeductionAmountHkd] = useState('');

  // 정산 일자 다중 선택 상태
  const [selectedSettlementDays, setSelectedSettlementDays] = useState<number[]>([]);

  // 선택 기기 판매 모달 트리거 상태
  const [isSellSelectedOnly, setIsSellSelectedOnly] = useState(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [isInventoryStatsModalOpen, setIsInventoryStatsModalOpen] = useState(false);
  const [inventoryStatsBasis, setInventoryStatsBasis] = useState<'all' | 'available'>('all');

  // 수동 환율 설정 핸들러
  const handleEditExchangeRate = () => {
    const val = prompt(
      displayLang === 'zh' 
        ? '请输入港币汇率 (HKD/KRW):\n(输入空值将重置为Naver实时汇率)' 
        : '홍콩달러 환율을 설정해주세요 (HKD/KRW).\n(공란으로 입력 시 네이버 환율로 초기화됩니다.)',
      cnyRate.toString()
    );
    
    if (val !== null) {
      const trimmed = val.trim();
      if (trimmed === '') {
        localStorage.removeItem('hkd_krw_exchange_rate');
        fetch('/api/exchange-rate')
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setCnyRate(data.rate);
              alert(
                displayLang === 'zh'
                  ? '已重置为Naver实时汇率: ₩' + data.rate
                  : '네이버 실시간 환율로 초기화되었습니다: ₩' + data.rate
              );
            }
          })
          .catch(err => {
            console.error(err);
            setCnyRate(175);
          });
      } else {
        const parsed = parseFloat(trimmed);
        if (!isNaN(parsed) && parsed > 0) {
          localStorage.setItem('hkd_krw_exchange_rate', parsed.toString());
          setCnyRate(parsed);
        } else {
          alert(
            displayLang === 'zh'
              ? '请输入有效的汇率数值。'
              : '올바른 환율 값을 입력해주세요.'
          );
        }
      }
    }
  };

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

  // 마진 정산 정렬 핸들러
  const handleSettleSort = (column: string) => {
    if (settleSortColumn === column) {
      if (settleSortDirection === 'asc') {
        setSettleSortDirection('desc');
      } else {
        setSettleSortColumn(null);
      }
    } else {
      setSettleSortColumn(column);
      setSettleSortDirection('asc');
    }
  };

  // 마진 정산 정렬 아이콘 렌더링
  const renderSettleSortIcon = (column: string) => {
    if (settleSortColumn !== column) {
      return <span style={{ opacity: 0.3, marginLeft: '4px', fontSize: '10px', cursor: 'pointer' }}>↕</span>;
    }
    return settleSortDirection === 'asc' 
      ? <span style={{ color: 'var(--accent-light)', marginLeft: '4px', fontSize: '10px', cursor: 'pointer' }}>▲</span> 
      : <span style={{ color: 'var(--accent-light)', marginLeft: '4px', fontSize: '10px', cursor: 'pointer' }}>▼</span>;
  };

  // ✅ 성능 최적화: 선택된 ID Set (O(1) 조회)
  const selectedHKIdsSet = useMemo(() => new Set(selectedHKIds), [selectedHKIds]);
  const selectedPendingIdsSet = useMemo(() => new Set(selectedPendingIds), [selectedPendingIds]);

  const isManualRate = typeof window !== 'undefined' && localStorage.getItem('hkd_krw_exchange_rate') !== null;

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

    // ✅ 성능 최적화: 2차 용량 필터를 적용하기 전 1차 필터링된 아이템 리스트
  const filteredHKItemsWithoutStorage = useMemo(() => hongkongInventory
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

  // ✅ 성능 최적화: 1차 필터링된 기기들로부터 존재하는 고유 용량 리스트 추출 (2차 필터용)
  const availableStorages = useMemo(() => {
    const set = new Set<string>();
    filteredHKItemsWithoutStorage.forEach(item => {
      if (item.storage) {
        set.add(item.storage.trim());
      }
    });
    return Array.from(set).sort();
  }, [filteredHKItemsWithoutStorage]);

  // ✅ 1차 필터(검색 등)가 바뀔 때 용량 필터를 전체('all')로 자동 리셋
  useEffect(() => {
    setHkStorageFilter('all');
  }, [hkSearchQuery, hkStatusFilter]);

  // ✅ 최종 2차 필터(용량)까지 적용된 홍콩 재고 리스트
  const filteredHKItems = useMemo(() => {
    if (hkStorageFilter === 'all') return filteredHKItemsWithoutStorage;
    return filteredHKItemsWithoutStorage.filter(item => (item.storage || '').trim() === hkStorageFilter);
  }, [filteredHKItemsWithoutStorage, hkStorageFilter]);

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
      grades: Record<string, number>;
    }> = {};

    for (const item of filteredHKItems) {
      const model = item.model_name || 'UNKNOWN';
      const cleanModel = model.trim().toUpperCase();
      const foundPet = petNameMap.get(cleanModel);
      const groupKey = foundPet ? (displayLang === 'zh' ? foundPet.zh : foundPet.ko) : model;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          modelName: groupKey,
          total: 0,
          available: 0,
          pending: 0,
          sold: 0,
          colors: {},
          grades: {}
        };
      }
      
      const g = groups[groupKey];
      g.total++;
      if (!item.is_sold) {
        g.available++;
        const grade = item.notes?.trim() || (displayLang === 'zh' ? '无' : '공란');
        g.grades[grade] = (g.grades[grade] || 0) + 1;
      } else if (!item.is_approved) {
        g.pending++;
      } else {
        g.sold++;
      }
      
      const c = item.color ? item.color.trim() : (displayLang === 'zh' ? '未知' : '미정');
      g.colors[c] = (g.colors[c] || 0) + 1;
    }

    // 정렬 방식 적용
    return Object.values(groups).sort((a, b) => {
      if (hkCardSortMode === 'name') {
        const nameA = getModelDisplayName(a.modelName);
        const nameB = getModelDisplayName(b.modelName);
        return nameA.localeCompare(nameB);
      }
      return b.total - a.total;
    });
  }, [filteredHKItems, displayLang, hkCardSortMode, getModelDisplayName]);

  const inventoryStats = useMemo(() => {
    const targetDevices = hongkongInventory.filter(item => {
      if (inventoryStatsBasis === 'available') return !item.is_sold;
      return true;
    });

    const totalCount = targetDevices.length;
    const totalCost = targetDevices.reduce((sum, item) => sum + (Number(item.purchase_cost) || 0), 0);

    const modelMap: Record<string, { modelName: string; count: number; cost: number }> = {};
    const modelGradeMap: Record<string, { modelName: string; grade: string; count: number; cost: number }> = {};

    targetDevices.forEach(item => {
      const model = item.model_name || '기형 미확인 / 未知型号';
      const rawGrade = item.notes?.trim() || '';
      const grade = rawGrade || (displayLang === 'zh' ? '无' : '공란');
      const key = `${model}_${grade}`;

      if (!modelMap[model]) {
        modelMap[model] = { modelName: model, count: 0, cost: 0 };
      }
      modelMap[model].count++;
      modelMap[model].cost += Number(item.purchase_cost) || 0;

      if (!modelGradeMap[key]) {
        modelGradeMap[key] = { modelName: model, grade, count: 0, cost: 0 };
      }
      modelGradeMap[key].count++;
      modelGradeMap[key].cost += Number(item.purchase_cost) || 0;
    });

    const modelsList = Object.values(modelMap).sort((a, b) => b.cost - a.cost);
    const modelGradesList = Object.values(modelGradeMap).sort((a, b) => b.cost - a.cost);

    return {
      totalCount,
      totalCost,
      modelsList,
      modelGradesList
    };
  }, [hongkongInventory, inventoryStatsBasis, displayLang, getModelDisplayName]);

  const [settlementSeller, setSettlementSeller] = useState('All');
  const [settlementMonth, setSettlementMonth] = useState('All');
  const [settlementSearch, setSettlementSearch] = useState('');

  useEffect(() => {
    setSelectedSettlementDays([]);
  }, [settlementMonth]);


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
  const [catLevel, setCatLevel] = useState<'large' | 'middle' | 'small'>('large');
  const [catParentLargeId, setCatParentLargeId] = useState<string>('');
  const [catParentMiddleId, setCatParentMiddleId] = useState<string>('');
  const [catParentLargeName, setCatParentLargeName] = useState<string>('');
  const [catParentMiddleName, setCatParentMiddleName] = useState<string>('');

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
  const [prodStatus, setProdStatus] = useState<string>('available');

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
    let token = sessionStorage.getItem('admin_token');
    let role = sessionStorage.getItem('admin_role') as any;

    // sessionStorage가 없는 경우 localStorage 유저 정보로 자동 복구
    if (!token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.role === 'admin' || parsed.role === 'manager' || parsed.role === 'staff') {
            sessionStorage.setItem('admin_token', 'true');
            sessionStorage.setItem('admin_role', parsed.role);
            sessionStorage.setItem('admin_role_name', parsed.role === 'admin' ? '어드민' : parsed.role === 'manager' ? '매니저' : '스탭');
            token = 'true';
            role = parsed.role;
          }
        } catch (e) {
          console.error('Failed to parse saved user for auto-login:', e);
        }
      }
    }

    if (!token) {
      router.push('/auth?redirect=/admin/dashboard');
    } else if (role === 'general') {
      router.push('/mypage');
    } else {
      if (role) {
        setUserRole(role);
      }
      loadAllData();
      // 모바일 환경일 때 기본적으로 홍콩 재고 탭으로 시작하고 기종 카드 뷰로 봅니다.
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        setActiveTab('hongkong-inventory');
        setHkViewMode('card');
      }
    }
  }, [router]);

  // 전역 데이터 페칭
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 모든 API 요청을 병렬(Parallel)로 동시에 시작하여 로딩 시간 단축
      const [tradeRes, prodRes, orderRes, priceRes, catRes, hkRes, rateRes, petRes, memberRes, permRes, deductLogsRes] = await Promise.all([
        fetch('/api/trade-ins'),
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/trade-in-prices'),
        fetch('/api/categories'),
        fetch('/api/hongkong-inventory'),
        fetch('/api/exchange-rate'),
        fetch('/api/model-pet-names'),
        fetch('/api/members'),
        fetch('/api/permissions', { cache: 'no-store' }),
        fetch('/api/bulk-sale-deductions')
      ]);

      // 응답 JSON 파싱도 병렬로 처리
      const [tradeData, prodData, orderData, priceData, catData, hkData, rateData, petData, memberData, permData, deductLogsData] = await Promise.all([
        tradeRes.json(),
        prodRes.json(),
        orderRes.json(),
        priceRes.json(),
        catRes.json(),
        hkRes.json(),
        rateRes.json(),
        petRes.json(),
        memberRes.json(),
        permRes.json(),
        deductLogsRes.json()
      ]);

      if (tradeData.success) setTradeIns(tradeData.data);
      if (prodData.success) setProducts(prodData.data);
      if (orderData.success) setOrders(orderData.data);
      if (priceData.success) setTradeInPrices(priceData.data);
      if (catData.success) setCategories(catData.data);
      if (hkData.success) setHongkongInventory(hkData.data);
      if (rateData?.success) {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('hkd_krw_exchange_rate') : null;
        if (!saved) {
          setCnyRate(rateData.rate);
        }
      }
      if (petData.success) setModelPetNames(petData.data);
      if (memberData.success) setMembers(memberData.data);
      if (deductLogsData.success) setBulkSaleDeductions(deductLogsData.data || []);

      if (permData?.success && permData.data && permData.data.length > 0) {
        const permRecord: Record<string, Record<string, boolean>> = {};
        permData.data.forEach((item: any) => {
          permRecord[item.role] = typeof item.permissions === 'string' ? JSON.parse(item.permissions) : item.permissions;
        });
        setPermissions(prev => ({
          ...DEFAULT_PERMISSIONS,
          ...prev,
          ...permRecord
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategoriesOnly = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 회원 관리 관련 상태 및 액션
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  const filteredMembers = useMemo(() => {
    const query = memberSearchQuery.trim().toLowerCase();
    if (!query) return members;
    return members.filter(m => 
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.phone_number && m.phone_number.includes(query))
    );
  }, [members, memberSearchQuery]);

  const handleUpdateMember = async (
    id: string, 
    name: string, 
    pin: string, 
    role: string, 
    address_province?: string, 
    address_city?: string, 
    address_detail?: string
  ) => {
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          name, 
          pin_code: pin, 
          role, 
          address_province, 
          address_city, 
          address_detail 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(displayLang === 'zh' ? '会员信息已更新！' : '회원 정보가 성공적으로 변경되었습니다!');
        loadAllData();
      } else {
        alert(data.error || '회원 수정 실패');
      }
    } catch (e) {
      console.error(e);
      alert('네트워크 오류');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(displayLang === 'zh' ? `确认删除会员 [${name}] 吗？` : `정말 [${name}] 회원을 삭제하시겠습니까?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/members?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert(displayLang === 'zh' ? '会员已删除！' : '회원이 성공적으로 삭제되었습니다!');
        loadAllData();
      } else {
        alert(data.error || '회원 삭제 실패');
      }
    } catch (e) {
      console.error(e);
      alert('네트워크 오류');
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
      setProdStatus(prod.status || 'available');
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
      setProdCategory(categories.filter(c => !c.parent_id)[0]?.name || '스마트폰');
      setProdSeries('');
      setProdBattery('95%');
      setProdCarrier('3사 공용 (알뜰폰/자급제 가능)');
      setProdStatus('available');
    }
    setIsProductModalOpen(true);
  };

  const handleProdCategoryChange = (catNameVal: string) => {
    setProdCategory(catNameVal);
    const largeObj = categories.find(c => c.name === catNameVal && !c.parent_id);
    const middleList = largeObj ? categories.filter(c => c.parent_id === largeObj.id) : [];
    const defaultBrand = middleList[0]?.name || '기타';
    setProdBrand(defaultBrand);
    
    const middleObj = middleList[0];
    const smallList = middleObj ? categories.filter(c => c.parent_id === middleObj.id) : [];
    setProdSeries(smallList[0]?.name || '기타');
  };

  const handleProdBrandChange = (brandNameVal: string) => {
    setProdBrand(brandNameVal);
    const largeObj = categories.find(c => c.name === prodCategory && !c.parent_id);
    const middleObj = largeObj ? categories.find(c => c.name === brandNameVal && c.parent_id === largeObj.id) : null;
    const smallList = middleObj ? categories.filter(c => c.parent_id === middleObj.id) : [];
    setProdSeries(smallList[0]?.name || '기타');
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
      status: prodStatus
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

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('정말로 이 주문을 삭제하시겠습니까? 관련 상품의 판매 상태가 자동으로 복구되지 않을 수 있으니 판매 상품 관리에서 직접 확인해 주세요.')) {
      return;
    }
    try {
      const res = await fetch(`/api/orders?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadAllData();
      } else {
        const data = await res.json();
        alert(data.error || '주문 삭제 실패');
      }
    } catch (err) {
      alert('서버 처리 오류');
    }
  };

  const handleRuleCategoryChange = (catNameVal: string) => {
    setRuleCategory(catNameVal);
    const largeObj = categories.find(c => c.name === catNameVal && !c.parent_id);
    const middleList = largeObj ? categories.filter(c => c.parent_id === largeObj.id) : [];
    const defaultBrand = middleList[0]?.name || '기타';
    setRuleBrand(defaultBrand);
    
    const middleObj = middleList[0];
    const smallList = middleObj ? categories.filter(c => c.parent_id === middleObj.id) : [];
    setRuleSeries(smallList[0]?.name || '기타');
  };

  const handleRuleBrandChange = (brandNameVal: string) => {
    setRuleBrand(brandNameVal);
    const largeObj = categories.find(c => c.name === ruleCategory && !c.parent_id);
    const middleObj = largeObj ? categories.find(c => c.name === brandNameVal && c.parent_id === largeObj.id) : null;
    const smallList = middleObj ? categories.filter(c => c.parent_id === middleObj.id) : [];
    setRuleSeries(smallList[0]?.name || '기타');
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
      const defaultLarge = categories.filter(c => !c.parent_id)[0]?.name || '스마트폰';
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
      
      setRuleCategory(defaultLarge);
      const largeObj = categories.find(c => c.name === defaultLarge && !c.parent_id);
      const middleList = largeObj ? categories.filter(c => c.parent_id === largeObj.id) : [];
      const defaultBrand = middleList[0]?.name || 'Apple';
      setRuleBrand(defaultBrand);
      
      const middleObj = middleList[0];
      const smallList = middleObj ? categories.filter(c => c.parent_id === middleObj.id) : [];
      setRuleSeries(smallList[0]?.name || '');
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

  const getCategoryPath = (cat: any) => {
    if (!cat) return '';
    if (!cat.parent_id) return cat.name;
    const parent = categories.find(c => c.id === cat.parent_id);
    if (!parent) return cat.name;
    if (!parent.parent_id) return `${parent.name} > ${cat.name}`;
    const grandParent = categories.find(c => c.id === parent.parent_id);
    if (!grandParent) return `${parent.name} > ${cat.name}`;
    return `${grandParent.name} > ${parent.name} > ${cat.name}`;
  };

  const getCategoryLevelText = (cat: any) => {
    if (!cat) return '';
    if (!cat.parent_id) return '대분류';
    const parent = categories.find(c => c.id === cat.parent_id);
    if (parent && !parent.parent_id) return '중분류';
    return '소분류';
  };

  // 6. 카테고리 관리 액션
  const openCategoryModal = (cat: any | null = null) => {
    setSelectedCategory(cat);
    if (cat) {
      setCatName(cat.name);
      setCatImage(cat.image || '');
      
      if (!cat.parent_id) {
        setCatLevel('large');
        setCatParentLargeId('');
        setCatParentMiddleId('');
        setCatParentLargeName('');
        setCatParentMiddleName('');
      } else {
        const parent = categories.find(c => c.id === cat.parent_id);
        if (parent && !parent.parent_id) {
          setCatLevel('middle');
          setCatParentLargeId(parent.id);
          setCatParentLargeName(parent.name);
          setCatParentMiddleId('');
          setCatParentMiddleName('');
        } else if (parent && parent.parent_id) {
          setCatLevel('small');
          setCatParentLargeId(parent.parent_id);
          const largeObj = categories.find(c => c.id === parent.parent_id);
          setCatParentLargeName(largeObj ? largeObj.name : '');
          setCatParentMiddleId(parent.id);
          setCatParentMiddleName(parent.name);
        } else {
          setCatLevel('large');
          setCatParentLargeId('');
          setCatParentMiddleId('');
          setCatParentLargeName('');
          setCatParentMiddleName('');
        }
      }
    } else {
      setCatName('');
      setCatImage('');
      setCatLevel('large');
      setCatParentLargeId('');
      setCatParentMiddleId('');
      setCatParentLargeName('');
      setCatParentMiddleName('');
    }
    setIsCategoryModalOpen(true);
  };

  const openCategoryModalForAdd = (level: 'large' | 'middle' | 'small', parentId: string, parentName: string) => {
    setSelectedCategory(null);
    setCatName('');
    setCatImage('');
    setCatLevel(level);
    
    if (level === 'large') {
      setCatParentLargeId('');
      setCatParentLargeName('');
      setCatParentMiddleId('');
      setCatParentMiddleName('');
    } else if (level === 'middle') {
      setCatParentLargeId(parentId);
      setCatParentLargeName(parentName);
      setCatParentMiddleId('');
      setCatParentMiddleName('');
    } else if (level === 'small') {
      const middleObj = categories.find(c => c.id === parentId);
      if (middleObj) {
        setCatParentLargeId(middleObj.parent_id || '');
        const largeObj = categories.find(c => c.id === middleObj.parent_id);
        setCatParentLargeName(largeObj ? largeObj.name : '');
        setCatParentMiddleId(middleObj.id);
        setCatParentMiddleName(middleObj.name);
      }
    }
    setIsCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    if (!catName) {
      alert('카테고리명을 입력해주세요.');
      return;
    }

    let parentId = null;
    let finalImage = catImage;

    if (catLevel === 'middle') {
      if (!catParentLargeId) {
        alert('대분류 카테고리를 선택해주세요.');
        return;
      }
      parentId = catParentLargeId;
    } else if (catLevel === 'small') {
      if (!catParentMiddleId) {
        alert('중분류 카테고리를 선택해주세요.');
        return;
      }
      parentId = catParentMiddleId;
    } else {
      if (!catImage) {
        finalImage = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150';
      }
    }

    const payload = {
      name: catName,
      image: finalImage,
      parent_id: parentId
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
        loadCategoriesOnly();
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
        loadCategoriesOnly();
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
    sessionStorage.removeItem('admin_role');
    sessionStorage.removeItem('admin_role_name');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  // ==========================================
  // 홍콩 재고 및 정산 관리 핸들러 함수
  // ==========================================

  // 고정 엑셀 열 레이아웃 파싱 공통 헬퍼 (붙여넣은 헤더 첫 행에서 인덱스를 동적으로 찾아 정렬)
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

    // 헤더 식별용 키워드 목록
    const headerKeywords = [
      '순번', 'p/g', 'pg', 'sticker', '일련번호', '스티커', 'pgno',
      '모델명', 'model', 'code', '机型', '型号',
      '펫네임', 'name', '기종', '名称', '품명',
      'imei', '串号', '일련', 'sn', 'serial',
      '색상', 'color', '颜色',
      '실판매가', 'price', 'cost', '매입가', '금액', '원가', '가격',
      '차감항목', '비고', '등급', 'notes', 'remark', 'grade', '等级'
    ];

    const hasHeader = firstRowClean.some(h => headerKeywords.some(k => h.includes(k)));
    const startIndex = hasHeader ? 1 : 0;

    const hasSeq = hasHeader && firstRowClean.some(h => h.includes('순번'));
    const offset = hasSeq ? 1 : 0;

    const findIdx = (keywords: string[], fallback: number) => {
      const idx = firstRowClean.findIndex(h => keywords.some(k => h.includes(k)));
      return idx > -1 ? idx : fallback;
    };

    const findExactIdx = (keywords: string[], fallback: number) => {
      const idx = firstRowClean.findIndex(h => keywords.some(k => h === k));
      return idx > -1 ? idx : fallback;
    };

    // 기본 헤더 파싱 규칙 (헤더 매칭 성공 시)
    let pgIdx = findIdx(['p/g', 'pg', 'sticker', '일련번호', '스티커', 'pgno'], 0 + offset);
    let modelIdx = findIdx(['모델명', 'model', 'code', '机型', '型号'], 1 + offset);
    let storageIdx = findIdx(['용량', 'storage', 'capacity', '内存', '规格'], 3 + offset);
    let petIdx = findIdx(['펫네임', 'name', '기종', '名称', '품명'], 2 + offset);
    let imeiIdx = findExactIdx(['imei'], findIdx(['imei', '串号', '일련', 'sn', 'serial'], 4 + offset));
    let colorIdx = findIdx(['색상', 'color', '颜色'], 6 + offset);
    let priceIdx = findExactIdx(['실판매가'], findIdx(['실판매가', 'price', 'cost', '매입가', '금액', '원가', '가격'], 9 + offset));
    let deductionItemIdx = findExactIdx(['차감항목', '비고', '등급'], findIdx(['차감항목', '비고', '등급', 'notes', 'remark', 'grade', '等级'], 10 + offset));

    if (!hasHeader) {
      // 헤더가 없는 경우 데이터 행 샘플링 분석으로 최적의 인덱스 자동 매핑
      const sampleRows = lines.slice(0, 10).filter(r => r.length >= 5);
      if (sampleRows.length > 0) {
        const colCount = sampleRows[0].length;
        let foundImei = -1;
        let foundPrice = -1;
        let foundGrade = -1;
        let foundStorage = -1;
        let foundSticker = -1;
        let foundColor = -1;

        for (let col = 0; col < colCount; col++) {
          let imeiScore = 0;
          let priceScore = 0;
          let gradeScore = 0;
          let storageScore = 0;
          let stickerScore = 0;
          let colorScore = 0;

          sampleRows.forEach(row => {
            if (col >= row.length) return;
            const val = row[col].trim();
            if (!val) return;

            // IMEI: 15자리 숫자
            if (/^\d{15}$/.test(val)) {
              imeiScore += 10;
            }

            // Sticker: 예: M080186268, 알파벳으로 시작하는 대량입고 일련번호 형식
            if (/^[A-Za-z]\d{9}$/.test(val) || /^[A-Za-z]\d+$/.test(val)) {
              stickerScore += 10;
            }

            // 용량: 64, 128, 256, 512, 1024 등
            if (/^(64|128|256|512|1024|1000|2000)$/.test(val)) {
              storageScore += 8;
            }

            // 가격: 콤마 포함 혹은 1000 ~ 10,000,000 사이 정수
            const cleanNum = val.replace(/,/g, '');
            if (/^\d+$/.test(cleanNum)) {
              const num = parseInt(cleanNum, 10);
              if (num >= 1000 && num <= 10000000) {
                priceScore += 5;
              }
            }

            // 등급: A, B, C, D, LCD, S, 0
            if (/^(A|B|C|D|LCD|S|0)$/i.test(val)) {
              gradeScore += 10;
            }

            // 색상: 영어/한글 주요 색상명 포함
            if (/^(black|white|red|blue|green|gold|silver|grey|gray|starlight|midnight|pink|purple|yellow|orange|violet|brown|bronze|블랙|화이트|골드|실버|그레이|레드|블루|그린|핑크|퍼플|옐로우|오렌지|브론즈)$/i.test(val)) {
              colorScore += 10;
            }
          });

          if (imeiScore > 5) foundImei = col;
          if (stickerScore > 5) foundSticker = col;
          if (storageScore > 5) foundStorage = col;
          if (priceScore > 3 && col !== foundImei && col !== foundSticker && col !== foundStorage) {
            foundPrice = col;
          }
          if (gradeScore > 5) foundGrade = col;
          if (colorScore > 5 && col !== foundSticker && col !== foundImei && col !== foundStorage && col !== foundPrice) {
            foundColor = col;
          }
        }

        if (foundSticker > -1) pgIdx = foundSticker;
        if (foundImei > -1) imeiIdx = foundImei;
        if (foundPrice > -1) priceIdx = foundPrice;
        if (foundGrade > -1) deductionItemIdx = foundGrade;
        if (foundColor > -1) colorIdx = foundColor;

        if (colCount >= 7) {
          modelIdx = (pgIdx === 0) ? 1 : 0;
          petIdx = (pgIdx === 0) ? 2 : 1;
        } else if (colCount >= 5) {
          modelIdx = 1;
          petIdx = 2;
        }
      }
    }

    const parsedRows: any[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;
      
      const item: any = {};
      
            // 1. 모델명 및 용량 파싱
      let rawModel = '';
      if (fields.modelName && modelIdx < row.length && row[modelIdx]) {
        rawModel = row[modelIdx].trim();
      }

      let parsedModel = rawModel;
      let parsedStorage = '';

      // 용량 컬럼이 따로 있는 경우 우선순위로 가져옴
      if (storageIdx < row.length && row[storageIdx]) {
        parsedStorage = row[storageIdx].trim();
      }

      // 모델명에 용량 패턴(예: _256G, 256GB 등)이 포함된 경우 용량 추출
      const storageMatch = rawModel.match(/_?(\d+)\s*(GB|G)/i);
      if (storageMatch) {
        if (!parsedStorage) {
          parsedStorage = storageMatch[1] + 'G'; // 256G 형식으로 통일
        }
      }

      // 모델명에 SM-[영문1자리][숫자3자리] 패턴이 포함된 경우 모델명 정제 (예: SM-F721N -> F721)
      const modelMatch = rawModel.match(/SM-([A-Z])(\d{3})/i);
      if (modelMatch) {
        parsedModel = modelMatch[1].toUpperCase() + modelMatch[2];
      }

      item.model_name = parsedModel || '기형 미확인 / 未知型号';
      item.storage = parsedStorage || '';

      // 2. 일련번호 (Sticker) -> P/G No가 Sticker이다!
      item.sticker = fields.pgNo && pgIdx < row.length && row[pgIdx] ? row[pgIdx] : '';

      // 3. IMEI
      item.imei = fields.imei && imeiIdx < row.length && row[imeiIdx] ? row[imeiIdx] : '';

      // 4. 색상
      item.color = fields.color && colorIdx > -1 && colorIdx < row.length && row[colorIdx] ? row[colorIdx] : '';

      // 5. 원가 (Excel의 실판매가가 우리에게는 원가!)
      item.purchase_cost = fields.sellPrice && priceIdx < row.length && row[priceIdx] ? row[priceIdx] : '0';

      // 6. 판매가 (입고 시점에는 판매가가 아직 없으므로 0)
      item.selling_price = '0';

      // 7. 배터리 (기본 100%)
      item.battery_pct = '100';

      // 8. 위치 (기본 Hong Kong)
      item.stock_location = 'Hong Kong';

      // 9. 등급/비고 (차감항목/비고/등급을 비고 필드에 저장)
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

  // 개별 기기 정보 수정 핸들러 및 저장 연동
  const openEditDeviceModal = useCallback((device: any) => {
    setEditingDevice(device);
    setEditingSticker(device.sticker || '');
    setEditingModelName(device.model_name || '');
    setEditingStorage(device.storage || '');
    setEditingColor(device.color || '');
    setEditingBattery(device.battery_pct || '100');
    setEditingCost(String(device.purchase_cost || '0'));
    setEditingNotes(device.notes || '');
    setEditDeviceOpen(true);
  }, []);

  const handleUpdateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    if (!editingModelName.trim()) {
      alert('모델명을 입력해주세요.');
      return;
    }

    setSavingDevice(true);
    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_device_info',
          id: editingDevice.id,
          sticker: editingSticker.trim(),
          model_name: editingModelName.trim(),
          storage: editingStorage.trim(),
          color: editingColor.trim(),
          battery_pct: editingBattery.trim(),
          purchase_cost: Number(editingCost) || 0,
          notes: editingNotes.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('기기 정보가 성공적으로 수정되었습니다.');
        setEditDeviceOpen(false);
        setEditingDevice(null);
        loadAllData();
      } else {
        alert(data.error || '수정에 실패했습니다.');
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setSavingDevice(false);
    }
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

    const availableHKDevices = isSellSelectedOnly
      ? hongkongInventory.filter(x => !x.is_sold && selectedHKIds.includes(x.id))
      : hongkongInventory.filter(x => !x.is_sold);
    const candidateDevices = availableHKDevices.filter(x => selectedBulkModels.includes(x.model_name));
    const soldDevices = candidateDevices.filter(x => !unsoldBulkDeviceIds.includes(x.id));
    const unsoldDevices = candidateDevices.filter(x => unsoldBulkDeviceIds.includes(x.id));

    if (soldDevices.length === 0) {
      alert('선택한 기종 중 판매 완료할 기기가 없습니다. 모든 기기가 미판매로 제외되었습니다.');
      return;
    }

    // 차감 내역 계산 (수동 입력 반영)
    const appliedDeductions = [];
    const customHkd = Number(customDeductionAmountHkd) || 0;
    if (customDeductionName.trim() && customHkd > 0) {
      appliedDeductions.push({
        name_ko: customDeductionName.trim(),
        name_zh: customDeductionName.trim(),
        quantity: 1,
        amount_hkd: customHkd,
        total_hkd: customHkd,
        total_krw: customHkd * cnyRate
      });
    }

    // 판매 요약 텍스트
    const soldSummaryList = selectedBulkModels.map(m => {
      const devices = soldDevices.filter(d => d.model_name === m);
      if (devices.length === 0) return null;
      return `${getModelDisplayName(m)} ${devices.length}대`;
    }).filter(Boolean);
    const soldSummary = soldSummaryList.join(', ');

    const priceDetails = selectedBulkModels.map(m => {
      const hkVal = Number(bulkSellingPrices[m]) || 0;
      const krwVal = hkVal * cnyRate;
      return `- ${m}: HK$${hkVal.toLocaleString()} (₩${Math.round(krwVal).toLocaleString()})`;
    }).join('\n');

    let confirmMsg = `선택하신 기종 총 ${candidateDevices.length}대 중\n` +
      `- 판매 완료 처리: ${soldDevices.length}대\n` +
      `- 기종별 판매 단가:\n${priceDetails}\n` +
      `- 미판매 제외(재고 보존): ${unsoldDevices.length}대\n`;

    if (appliedDeductions.length > 0) {
      const d = appliedDeductions[0];
      confirmMsg += `\n- 차감 내역 적용:\n  * ${d.name_ko}: 총 HK$${d.total_hkd.toLocaleString()} (₩${Math.round(d.total_krw).toLocaleString()}) 차감\n`;
    }

    confirmMsg += `\n정말로 판매 완료 처리를 실행하시겠습니까?`;

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
          remainingIdentifiers,
          exchangeRate: cnyRate,
          deductions: appliedDeductions,
          soldSummary
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
        setBulkSaleDeductionQuantities({});
        setCustomDeductionName('');
        setCustomDeductionAmountHkd('');
        setSelectedHKIds([]);
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
  const openCardBulkSaleModal = useCallback((modelName: string, grade: any = null) => {
    setCardBulkSaleModel(modelName);
    if (Array.isArray(grade)) {
      setCardBulkSaleGrades(grade);
    } else if (grade) {
      setCardBulkSaleGrades([grade]);
    } else {
      setCardBulkSaleGrades(null);
    }
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

    const targetModelNames = new Set<string>();
    if (cardBulkSaleModel) {
      targetModelNames.add(cardBulkSaleModel.trim().toUpperCase());
      for (const [modelCode, petInfo] of petNameMap.entries()) {
        if (
          petInfo.ko.trim() === cardBulkSaleModel.trim() ||
          petInfo.zh.trim() === cardBulkSaleModel.trim()
        ) {
          targetModelNames.add(modelCode.toUpperCase());
          if (modelCode.toUpperCase().startsWith('SM-')) {
            targetModelNames.add(modelCode.toUpperCase().substring(3));
          } else {
            targetModelNames.add('SM-' + modelCode.toUpperCase());
          }
        }
      }
    }

    const availableHKDevices = hongkongInventory.filter(x => {
      const modelClean = (x.model_name || '').trim().toUpperCase();
      const isModelMatch = targetModelNames.has(modelClean) || 
        (modelClean.startsWith('SM-') && targetModelNames.has(modelClean.substring(3))) ||
        (!modelClean.startsWith('SM-') && targetModelNames.has('SM-' + modelClean));

      return (
        isModelMatch && 
        !x.is_sold &&
        (!cardBulkSaleGrades || cardBulkSaleGrades.length === 0 || cardBulkSaleGrades.includes(x.notes?.trim() || (displayLang === 'zh' ? '无' : '공란')))
      );
    });
    const excludedDevices = availableHKDevices.filter(x => excludedDeviceIds.has(x.id));
    const soldDevices = availableHKDevices.filter(x => !excludedDeviceIds.has(x.id));

    if (soldDevices.length === 0) {
      alert('판매 완료 처리할 기기가 없습니다. 모든 기기가 제외되었습니다.');
      return;
    }

    // 차감 내역 계산 (수동 입력 반영)
    const appliedDeductions = [];
    const customHkd = Number(customDeductionAmountHkd) || 0;
    if (customDeductionName.trim() && customHkd > 0) {
      appliedDeductions.push({
        name_ko: customDeductionName.trim(),
        name_zh: customDeductionName.trim(),
        quantity: 1,
        amount_hkd: customHkd,
        total_hkd: customHkd,
        total_krw: customHkd * cnyRate
      });
    }

    const soldSummary = `${getModelDisplayName(cardBulkSaleModel)}${cardBulkSaleGrades && cardBulkSaleGrades.length > 0 ? ` [${cardBulkSaleGrades.join(', ')}]` : ` [${displayLang === 'zh' ? '所有等级' : '전체 등급'}]`} ${soldDevices.length}대`;

    let confirmMsg = `기종: ${getModelDisplayName(cardBulkSaleModel)}\n` +
      `- 등급: ${cardBulkSaleGrades && cardBulkSaleGrades.length > 0 ? cardBulkSaleGrades.join(', ') : (displayLang === 'zh' ? '所有等级 (전체)' : '전체 등급')}\n` +
      `- 판매 처리: ${soldDevices.length}대\n` +
      `- 판매 단가: HK$${Number(cardBulkUnitPrice).toLocaleString()} (₩${Math.round(Number(cardBulkUnitPrice) * cnyRate).toLocaleString()})\n` +
      `- 제외 기기: ${excludedDevices.length}대\n`;

    if (appliedDeductions.length > 0) {
      const d = appliedDeductions[0];
      confirmMsg += `\n- 차감 내역 적용:\n  * ${d.name_ko}: 총 HK$${d.total_hkd.toLocaleString()} (₩${Math.round(d.total_krw).toLocaleString()}) 차감\n`;
    }

    confirmMsg += `\n정말로 판매 처리를 실행하시겠습니까?\n确认执行批量销售吗？`;

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
          remainingIdentifiers,
          exchangeRate: cnyRate,
          deductions: appliedDeductions,
          soldSummary
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`성공적으로 ${soldDevices.length}대의 판매 처리가 완료되었습니다!`);
        setCardBulkSaleModel(null);
        setCardBulkSaleGrades(null);
        setBulkSaleDeductionQuantities({});
        setCustomDeductionName('');
        setCustomDeductionAmountHkd('');
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

  // 판매 승인 대기 기기 반려 (재고 복구)
  const executeCancelApproval = async (deviceIds: string[]) => {
    if (deviceIds.length === 0) return;
    if (!confirm(`선택한 ${deviceIds.length}건의 판매를 반려하고 재고 상태로 되돌리시겠습니까? \n确认驳回这 ${deviceIds.length} 笔销售并退回库存吗？`)) return;

    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_sale',
          deviceIds
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('반려 처리가 완료되어 재고로 복구되었습니다. / 驳회처리 완료！');
        setSelectedPendingIds([]);
        loadAllData();
      } else {
        alert(data.error || '반려 처리 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  // 정산 완료 기기 승인 취소 (대기 상태로 롤백)
  const executeCancelSettledApproval = async (deviceIds: string[]) => {
    if (deviceIds.length === 0) return;
    if (!confirm(`선택한 ${deviceIds.length}건의 정산 승인을 취소하고 승인 대기 상태로 되돌리시겠습니까? \n确认取消这 ${deviceIds.length} 笔销售审批并退回待审批状态吗？`)) return;

    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_approval',
          deviceIds
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('승인 취소 처리가 완료되어 대기 목록으로 이동되었습니다. / 审批已取消！');
        loadAllData();
      } else {
        alert(data.error || '승인 취소 실패');
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

  // 기기 판매 정보 수정 모달 오픈
  const openEditSaleModal = (device: any) => {
    setEditSaleDevice(device);
    setEditSalePrice(device.selling_price?.toString() || '0');
    setEditSaleDate(device.sale_date || new Date().toISOString().split('T')[0]);
    setEditSellerName(device.seller_name || '');
    setEditSaleModalOpen(true);
  };

  // 기기 판매 정보 수정 실행
  const executeUpdateSaleInfo = async () => {
    if (!editSaleDevice) return;
    if (!editSaleDate) {
      alert('판매 일자를 입력해주세요.');
      return;
    }
    if (!editSellerName) {
      alert('판매원을 선택해주세요.');
      return;
    }
    if (!editSalePrice || isNaN(Number(editSalePrice)) || Number(editSalePrice) < 0) {
      alert('올바른 판매가를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_sale_info',
          id: editSaleDevice.id,
          saleDate: editSaleDate,
          sellerName: editSellerName,
          sellingPrice: Number(editSalePrice)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('판매 정보 수정이 완료되었습니다! / 修改成功！');
        setEditSaleModalOpen(false);
        setEditSaleDevice(null);
        loadAllData();
      } else {
        alert(data.error || '수정 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  // 차감 내역 수정 모달 오픈
  const openEditDeductionModal = (log: any) => {
    setEditDeductionItem(log);
    setEditDeductionNameKo(log.name_ko);
    setEditDeductionNameZh(log.name_zh);
    setEditDeductionQty(log.quantity.toString());
    setEditDeductionAmountHkd(log.amount_hkd.toString());
    setEditDeductionModalOpen(true);
  };

  // 차감 내역 수정 실행
  const executeUpdateDeduction = async () => {
    if (!editDeductionItem) return;
    if (!editDeductionNameKo || !editDeductionNameZh) {
      alert('차감 사유를 한국어와 중국어 모두 입력해주세요.');
      return;
    }
    if (isNaN(Number(editDeductionQty)) || Number(editDeductionQty) <= 0) {
      alert('올바른 수량을 입력해주세요.');
      return;
    }
    if (isNaN(Number(editDeductionAmountHkd)) || Number(editDeductionAmountHkd) < 0) {
      alert('올바른 단가를 입력해주세요.');
      return;
    }

    const qty = Number(editDeductionQty);
    const unitHkd = Number(editDeductionAmountHkd);
    const totHkd = qty * unitHkd;
    const totKrw = Math.round(totHkd * (editDeductionItem.exchange_rate || cnyRate));

    try {
      const res = await fetch('/api/bulk-sale-deductions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editDeductionItem.id,
          name_ko: editDeductionNameKo,
          name_zh: editDeductionNameZh,
          quantity: qty,
          amount_hkd: unitHkd,
          total_hkd: totHkd,
          total_krw: totKrw,
          exchange_rate: editDeductionItem.exchange_rate || cnyRate,
          seller_name: editDeductionItem.seller_name,
          sold_summary: editDeductionItem.sold_summary
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('차감 내역이 수정되었습니다! / 扣除项修改成功！');
        setEditDeductionModalOpen(false);
        setEditDeductionItem(null);
        loadAllData();
      } else {
        alert(data.error || '수정 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  // 차감 내역 삭제 실행
  const executeDeleteDeduction = async (id: string) => {
    if (!confirm('정말로 이 차감 내역을 삭제하시겠습니까?\n确认删除该扣除项记录吗？')) return;
    try {
      const res = await fetch(`/api/bulk-sale-deductions?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('차감 내역이 성공적으로 삭제되었습니다. / 删除成功！');
        loadAllData();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  // 기종 카드 일괄 가격 수정 모달 오픈
  const openBulkEditModal = (card: any) => {
    setBulkEditCard(card);
    // 평균 판매 가격(총 매출액 / 대수)을 구해서 초기값으로 제공
    const avgPriceHkd = card.count > 0 ? Math.round((card.totalRevenue / cnyRate) / card.count) : 0;
    setBulkEditPrice(avgPriceHkd.toString());
    setBulkEditModalOpen(true);
  };

  // 기종 카드 일괄 가격 수정 실행
  const executeBulkPriceUpdate = async () => {
    if (!bulkEditCard) return;
    if (!bulkEditPrice || isNaN(Number(bulkEditPrice)) || Number(bulkEditPrice) < 0) {
      alert('올바른 판매 단가를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_bulk_settled_prices',
          month: bulkEditCard.month,
          modelName: bulkEditCard.modelName,
          sellingPrice: Number(bulkEditPrice)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('해당 기종의 판매 가격이 일괄 수정되었습니다! / 批量修改成功！');
        setBulkEditModalOpen(false);
        setBulkEditCard(null);
        loadAllData();
      } else {
        alert(data.error || '일괄 수정 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };





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

  const handleUpdateGrade = useCallback(async (id: string, newGrade: string) => {
    try {
      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_notes',
          id,
          notes: newGrade
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '등급 수정 실패');
      } else {
        setHongkongInventory(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, notes: newGrade };
          }
          return item;
        }));
      }
    } catch (e) {
      alert('등급 수정 중 오류가 발생했습니다.');
    }
  }, []);

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
      
      {/* 모바일 상단 헤더 */}
      <div className={styles.mobileHeader}>
        <button 
          className={styles.mobileMenuBtn} 
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="메뉴 열기"
        >
          <Menu size={24} />
        </button>
        <div className={styles.mobileLogo}>TRUE MOBILE ADMIN</div>
        <div style={{ width: 24 }} /> {/* 우측 정렬 밸런스용 */}
      </div>

      {isMobileSidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* 1. 사이드 바 */}
      <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          TRUE MOBILE ADMIN
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 'bold' }}>
            {displayLang === 'zh' ? '当前权限' : '접속 권한'}: <span style={{ color: 'var(--accent-light)' }}>{
              userRole === 'admin' ? (displayLang === 'zh' ? '超级管理员' : '어드민') :
              userRole === 'manager' ? (displayLang === 'zh' ? '经理' : '매니저') :
              userRole === 'staff' ? (displayLang === 'zh' ? '职员' : '스탭') :
              (displayLang === 'zh' ? '普通会员' : '일반')
            }</span>
          </div>
        </div>
        
        <nav className={styles.menuList}>
          {permissions[userRole]?.['home'] && (
            <button 
              onClick={() => {
                setActiveTab('home');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'home' ? styles.menuItemActive : ''}`}
            >
              <BarChart3 size={18} /> {displayLang === 'zh' ? '控制台' : '대시보드 홈'}
            </button>
          )}
          
          {permissions[userRole]?.['trade-ins'] && (
            <button 
              onClick={() => {
                setActiveTab('trade-ins');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'trade-ins' ? styles.menuItemActive : ''}`}
            >
              <Smartphone size={18} /> {displayLang === 'zh' ? `回收订单 (${tradeIns.length})` : `매입 신청 관리 (${tradeIns.length})`}
            </button>
          )}
          
          {permissions[userRole]?.['products'] && (
            <button 
              onClick={() => {
                setActiveTab('products');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'products' ? styles.menuItemActive : ''}`}
            >
              <ShoppingBag size={18} /> {displayLang === 'zh' ? `商品管理 (${products.length})` : `판매 상품 관리 (${products.length})`}
            </button>
          )}
          
          {permissions[userRole]?.['orders'] && (
            <button 
              onClick={() => {
                setActiveTab('orders');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'orders' ? styles.menuItemActive : ''}`}
            >
              <ClipboardList size={18} /> {displayLang === 'zh' ? `订单发货 (${orders.length})` : `주문 배송 관리 (${orders.length})`}
            </button>
          )}
          
          {permissions[userRole]?.['prices'] && (
            <button 
              onClick={() => {
                setActiveTab('prices');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'prices' ? styles.menuItemActive : ''}`}
            >
              <Settings size={18} /> {displayLang === 'zh' ? `回收报价 (${tradeInPrices.length})` : `매입 시세 설정 (${tradeInPrices.length})`}
            </button>
          )}

          {permissions[userRole]?.['categories'] && (
            <button 
              onClick={() => {
                setActiveTab('categories');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'categories' ? styles.menuItemActive : ''}`}
            >
              <Layers size={18} /> {displayLang === 'zh' ? `分类管理 (${categories.length})` : `카테고리 관리 (${categories.length})`}
            </button>
          )}

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }} />

          {permissions[userRole]?.['hongkong-inventory'] && (
            <button 
              onClick={() => {
                setActiveTab('hongkong-inventory');
                setHkViewMode('card');
                setHkSearchQuery('');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'hongkong-inventory' ? styles.menuItemActive : ''}`}
            >
              <Smartphone size={18} /> {displayLang === 'zh' ? '香港库存' : '홍콩 재고 관리'}
            </button>
          )}

          {permissions[userRole]?.['completed-sales'] && (
            <button 
              onClick={() => {
                setActiveTab('completed-sales');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'completed-sales' ? styles.menuItemActive : ''}`}
            >
              <CheckCircle2 size={18} /> {displayLang === 'zh' ? '销售审批' : '판매 승인'}
            </button>
          )}

          {permissions[userRole]?.['margin-settlement'] && (
            <button 
              onClick={() => {
                setActiveTab('margin-settlement');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'margin-settlement' ? styles.menuItemActive : ''}`}
            >
              <Coins size={18} /> {displayLang === 'zh' ? '利润结算' : '마진 및 정산'}
            </button>
          )}

          {permissions[userRole]?.['model-pet-names'] && (
            <button 
              onClick={() => {
                setActiveTab('model-pet-names');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'model-pet-names' ? styles.menuItemActive : ''}`}
            >
              <Settings size={18} style={{ color: 'var(--accent-light)' }} /> {displayLang === 'zh' ? `型号别称 (${modelPetNames.length})` : `기종 펫네임 관리 (${modelPetNames.length})`}
            </button>
          )}

          {(userRole === 'admin' || userRole === 'manager' || permissions[userRole]?.['deductions']) && (
            <button 
              onClick={() => {
                setActiveTab('deduction-rules');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'deduction-rules' ? styles.menuItemActive : ''}`}
            >
              <Settings size={18} style={{ color: 'var(--danger-color)' }} /> {displayLang === 'zh' ? '扣除项管理' : '차감 항목 관리'}
            </button>
          )}

          {permissions[userRole]?.['members'] && (
            <button 
              onClick={() => {
                setActiveTab('members');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'members' ? styles.menuItemActive : ''}`}
            >
              <Users size={18} style={{ color: 'var(--accent-light)' }} /> {displayLang === 'zh' ? '会员管理' : '회원 등급 관리'} ({members.length})
            </button>
          )}

          {/* 권한 관리 탭 */}
          {permissions[userRole]?.['permissions'] && (
            <button 
              onClick={() => {
                setActiveTab('permissions');
                setIsMobileSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === 'permissions' ? styles.menuItemActive : ''}`}
            >
              <Settings size={18} style={{ color: 'var(--warning-color)' }} /> {displayLang === 'zh' ? '权限管理' : '메뉴 권한 설정'}
            </button>
          )}

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }} />

          {permissions[userRole]?.['scanner'] && (
            <a 
              href="/admin/scanner"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={styles.menuItem}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <Smartphone size={18} style={{ color: 'var(--warning-color)' }} />
              <span style={{ color: 'var(--warning-color)' }}>{displayLang === 'zh' ? '扫码销售 ↗' : '바코드 스캐너 / 扫码销售 ↗'}</span>
            </a>
          )}
        </nav>

        <button 
          onClick={() => {
            handleLogout();
            setIsMobileSidebarOpen(false);
          }}
          style={{ marginTop: 'auto' }}
          className={styles.menuItem}
        >
          <LogOut size={18} style={{ color: 'var(--danger-color)' }} />
          <span style={{ color: 'var(--danger-color)' }}>{displayLang === 'zh' ? '退出登录' : '로그아웃'}</span>
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
            {(userRole === 'admin' || userRole === 'manager') ? (
              <>
                <span 
                  onClick={handleEditExchangeRate}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--success-color)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  title={displayLang === 'zh' ? '点击修改汇率 / Click to edit exchange rate' : '클릭하여 환율 수정 / Click to edit exchange rate'}
                >
                  <Coins size={14} /> 
                  {displayLang === 'zh' ? '港币汇率 / 汇率' : '홍콩달러 환율 / 汇率'} ({isManualRate ? (displayLang === 'zh' ? '手动' : '수동') : 'Naver'}): ₩{cnyRate.toFixed(2)}
                  <span style={{ fontSize: '10px', marginLeft: '4px', textDecoration: 'underline', opacity: 0.8 }}>
                    {displayLang === 'zh' ? '修改' : '수정'}
                  </span>
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  * 마진 계산 시 본 환율 기준으로 원화(KRW)로 자동 환산됩니다. (HKD HK$ → KRW ₩)
                </span>
              </>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>
                {displayLang === 'zh' ? '欢迎访问后台管理系统' : '관리 대시보드에 오신 것을 환영합니다.'}
              </span>
            )}
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
              <h2 className={styles.pageTitle}>{displayLang === 'zh' ? '控制台概要' : '대시보드 종합 요약'}</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '实时交易统计' : '실시간 거래 집계'}</span>
            </div>

            {/* 통계 지표 카드 */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>{displayLang === 'zh' ? '回收结算总支出' : '총 매입 정산 지출'}</span>
                  <span className={styles.metricVal}>{formatCurrency(stats.totalPaid, 'KRW')}</span>
                </div>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                  <Coins size={22} />
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>{displayLang === 'zh' ? '进行中回收单수' : '진행중인 매입 건수'}</span>
                  <span className={styles.metricVal}>{stats.activeRequests}{displayLang === 'zh' ? '单' : '건'}</span>
                </div>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
                  <Smartphone size={22} />
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>{displayLang === 'zh' ? '二手手机销售总额' : '총 중고폰 판매 매출'}</span>
                  <span className={styles.metricVal}>{formatCurrency(stats.totalSales, 'KRW')}</span>
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
                  <span className={styles.tableTitle}>{displayLang === 'zh' ? '最新回收申请' : '최근 접수된 매입 신청'}</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>{displayLang === 'zh' ? '客户姓名' : '고객명'}</th>
                        <th>{displayLang === 'zh' ? '机型' : '기종'}</th>
                        <th>{displayLang === 'zh' ? '自测价格' : '자가진단가'}</th>
                        <th>{displayLang === 'zh' ? '状态' : '상태'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeIns.slice(0, 5).map(t => (
                        <tr key={t.id}>
                          <td>{t.members?.name || (displayLang === 'zh' ? '注销会员' : '가입탈퇴')}</td>
                          <td>{t.brand} {t.model_name} ({t.storage})</td>
                          <td>{formatCurrency(t.estimated_price, 'KRW')}</td>
                          <td>
                            {t.status === 'pending' ? (displayLang === 'zh' ? '待处理' : '대기') : 
                             t.status === 'cancelled' ? (displayLang === 'zh' ? '已取消' : '취소됨') : 
                             (displayLang === 'zh' ? '已完成' : '완료')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <span className={styles.tableTitle}>{displayLang === 'zh' ? '最新订单' : '최근 접수된 주문'}</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>{displayLang === 'zh' ? '购买者' : '구매자'}</th>
                        <th>{displayLang === 'zh' ? '金额' : '금액'}</th>
                        <th>{displayLang === 'zh' ? '配送状态' : '배송상태'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td>{o.shipping_name}</td>
                          <td>{formatCurrency(o.price, 'KRW')}</td>
                          <td>
                            {o.status === 'pending' ? (displayLang === 'zh' ? '待发货' : '배송대기') : 
                             o.status === 'shipping' ? (displayLang === 'zh' ? '已发货' : '배송중') : 
                             o.status === 'delivered' ? (displayLang === 'zh' ? '已完成' : '배송완료') : 
                             (displayLang === 'zh' ? '已取消' : '취소')}
                          </td>
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
                        <td>{formatCurrency(t.estimated_price, 'KRW')}</td>
                        <td>
                          {t.final_price !== null ? (
                            <span style={{ fontWeight: 'bold', color: 'var(--warning-color)' }}>{formatCurrency(t.final_price, 'KRW')}</span>
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
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>{formatCurrency(p.price, 'KRW')}</td>
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
                      <th>작업</th>
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
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>{formatCurrency(o.price, 'KRW')}</td>
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
                        <td>
                          <button 
                            onClick={() => handleDeleteOrder(o.id)}
                            className={styles.btnCancel}
                            style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent' }}
                          >
                            삭제
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
                          <td style={{ color: 'var(--success-color)', fontWeight: '600' }}>{formatCurrency(r.base_price, 'KRW')}</td>
                          <td style={{ color: 'var(--danger-color)' }}>-{formatCurrency(r.storage_128g_deduct, 'KRW')}</td>
                          <td style={{ color: 'var(--accent-light)' }}>+{formatCurrency(r.storage_512g_add, 'KRW')}</td>
                          <td>
                            <span style={{ color: 'var(--danger-color)' }}>-{formatCurrency(r.screen_scratch_deduct, 'KRW')}</span> / 
                            <span style={{ color: 'var(--danger-color)', fontWeight: '600' }}> -{formatCurrency(r.screen_broken_deduct, 'KRW')}</span>
                          </td>
                          <td>
                            <span style={{ color: 'var(--danger-color)' }}>-{formatCurrency(r.body_scratch_deduct, 'KRW')}</span> / 
                            <span style={{ color: 'var(--danger-color)', fontWeight: '600' }}> -{formatCurrency(r.body_broken_deduct, 'KRW')}</span>
                          </td>
                          <td style={{ color: 'var(--danger-color)' }}>-{formatCurrency(r.camera_error_deduct, 'KRW')}</td>
                          <td style={{ color: 'var(--danger-color)' }}>-{formatCurrency(r.screen_burn_deduct, 'KRW')}</td>
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
              <div>
                <h2 className={styles.pageTitle}>카테고리(기종) 관리</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  대분류 ➡️ 제조사(중분류) ➡️ 시리즈(소분류)로 연결되는 계단식 구조를 직관적으로 관리할 수 있습니다.
                </p>
              </div>
              <button 
                onClick={() => openCategoryModalForAdd('large', '', '')} 
                className={styles.btnSave} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <Plus size={16} /> 새 대분류 추가
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              {(() => {
                const largeCategories = categories.filter(c => !c.parent_id);
                
                if (categories.length === 0) {
                  return (
                    <div style={{ 
                      textAlign: 'center', 
                      color: 'var(--text-muted)', 
                      padding: '80px 40px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)'
                    }}>
                      등록된 카테고리가 없습니다. [새 대분류 추가]를 눌러 첫 카테고리를 등록해보세요.
                    </div>
                  );
                }

                return largeCategories.map(large => {
                  const middles = categories.filter(c => c.parent_id === large.id);
                  return (
                    <div key={large.id} style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                      {/* Large Category Row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {large.image ? (
                            <img 
                              src={large.image} 
                              alt={large.name} 
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            />
                          ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                              <Layers size={20} />
                            </div>
                          )}
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>대분류</span>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: '4px 0 0 0' }}>{large.name}</h3>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            onClick={() => openCategoryModalForAdd('middle', large.id, large.name)}
                            className={styles.btnSave}
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#1e3a8a', color: '#93c5fd', cursor: 'pointer' }}
                          >
                            <Plus size={14} /> 중분류(제조사) 추가
                          </button>
                          <button 
                            onClick={() => openCategoryModal(large)}
                            className={styles.btnCancel}
                            style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--accent-light)', color: 'var(--accent-light)', backgroundColor: 'transparent', cursor: 'pointer' }}
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => deleteCat(large.id)}
                            className={styles.btnCancel}
                            style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent', cursor: 'pointer' }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {/* Middles List */}
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 20px', gap: '12px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                        {middles.map(middle => {
                          const smalls = categories.filter(c => c.parent_id === middle.id);
                          return (
                            <div key={middle.id} style={{
                              borderLeft: '2px solid rgba(255, 255, 255, 0.08)',
                              paddingLeft: '16px',
                              marginTop: '4px',
                              marginBottom: '8px'
                            }}>
                              {/* Middle Category Row */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 0'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>└</span>
                                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#fde68a', backgroundColor: '#78350f', padding: '2px 6px', borderRadius: '4px' }}>중분류</span>
                                  <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{middle.name}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button 
                                    onClick={() => openCategoryModalForAdd('small', middle.id, `${large.name} > ${middle.name}`)}
                                    className={styles.btnSave}
                                    style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#78350f', color: '#fde68a', cursor: 'pointer' }}
                                  >
                                    <Plus size={12} /> 소분류(시리즈) 추가
                                  </button>
                                  <button 
                                    onClick={() => openCategoryModal(middle)}
                                    className={styles.btnCancel}
                                    style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid var(--accent-light)', color: 'var(--accent-light)', backgroundColor: 'transparent', cursor: 'pointer' }}
                                  >
                                    수정
                                  </button>
                                  <button 
                                    onClick={() => deleteCat(middle.id)}
                                    className={styles.btnCancel}
                                    style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent', cursor: 'pointer' }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>

                              {/* Smalls List */}
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                paddingLeft: '24px',
                                marginTop: '8px'
                              }}>
                                {smalls.map(small => (
                                  <div key={small.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '6px 12px'
                                  }}>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#6ee7b7', backgroundColor: '#064e3b', padding: '1px 4px', borderRadius: '4px' }}>소분류</span>
                                    <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{small.name}</span>
                                    <div style={{ display: 'flex', gap: '6px', marginLeft: '6px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                                      <button 
                                        onClick={() => openCategoryModal(small)}
                                        style={{ border: 'none', background: 'none', color: 'var(--accent-light)', fontSize: '11px', cursor: 'pointer', padding: '2px' }}
                                      >
                                        수정
                                      </button>
                                      <button 
                                        onClick={() => deleteCat(small.id)}
                                        style={{ border: 'none', background: 'none', color: 'var(--danger-color)', fontSize: '11px', cursor: 'pointer', padding: '2px' }}
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {smalls.length === 0 && (
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.5, fontStyle: 'italic', padding: '4px 0' }}>
                                    등록된 소분류가 없습니다.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {middles.length === 0 && (
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', opacity: 0.5, fontStyle: 'italic', padding: '4px 0' }}>
                            등록된 중분류가 없습니다. 우측 상단의 [중분류 추가] 버튼을 클릭해 하위 브랜드를 먼저 등록해보세요.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
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
              <div className={styles.actionButtonGroup}>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className={styles.btnSave}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Plus size={16} /> {displayLang === 'zh' ? '批量导入 (Excel 粘贴)' : '대량 입고 (엑셀 붙여넣기)'}
                </button>
                <button
                  onClick={() => setIsInventoryStatsModalOpen(true)}
                  className={styles.btnCancel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid var(--accent-light)',
                    color: 'var(--accent-light)',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <BarChart3 size={16} /> {displayLang === 'zh' ? '库存统计' : '재고 통계'}
                </button>
                <button
                  onClick={() => {
                    setIsSellSelectedOnly(false);
                    setSelectedBulkModels([]);
                    setUnsoldBulkDeviceIds([]);
                    setBulkSaleDate(new Date().toISOString().split('T')[0]);
                    setBulkSellerName('레이');
                    setBulkSellingPrices({});
                    setBulkSaleDeductionQuantities({});
                    setIsBulkSaleModalOpen(true);
                  }}
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
                {selectedHKIds.length > 0 && selectedHKIds.filter(id => {
                  const item = inventoryMap.get(id);
                  return item && !item.is_sold;
                }).length > 0 && (
                  <button
                    onClick={() => {
                      const unsoldSelected = selectedHKIds.filter(id => {
                        const item = inventoryMap.get(id);
                        return item && !item.is_sold;
                      });
                      if (unsoldSelected.length === 0) return;
                      
                      // Group models to auto-fill selected models
                      const models = Array.from(new Set(unsoldSelected.map(id => {
                        const item = inventoryMap.get(id);
                        return item?.model_name;
                      }).filter(Boolean)));
                      
                      setIsSellSelectedOnly(true);
                      setSelectedBulkModels(models);
                      setUnsoldBulkDeviceIds([]); // by default all selected are sold
                      setBulkSaleDate(new Date().toISOString().split('T')[0]);
                      setBulkSellerName('레이');
                      setBulkSellingPrices({});
                      setBulkSaleDeductionQuantities({});
                      setIsBulkSaleModalOpen(true);
                    }}
                    className={styles.btnSave}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--success-color)',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={16} /> {displayLang === 'zh' ? `选定设备批量销售 (${selectedHKIds.filter(id => {
                      const item = inventoryMap.get(id);
                      return item && !item.is_sold;
                    }).length}台)` : `선택 기기 일괄 판매 (${selectedHKIds.filter(id => {
                      const item = inventoryMap.get(id);
                      return item && !item.is_sold;
                    }).length}대)`}
                  </button>
                )}
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
            <div className={styles.filterControlBar}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>{displayLang === 'zh' ? '库存状态:' : '재고 상태:'}</span>
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--success-color)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  {displayLang === 'zh' ? '仅显示在库 (Available)' : '가용 실재고만 표시'}
                </span>
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
            <div className={styles.statsInfoBar}>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
                {(userRole === 'admin' || userRole === 'manager') && (
                  <span 
                    onClick={handleEditExchangeRate}
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--success-color)',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      cursor: 'pointer'
                    }}
                    title={displayLang === 'zh' ? '点击修改汇率 / Click to edit exchange rate' : '클릭하여 환율 수정 / Click to edit exchange rate'}
                  >
                    {displayLang === 'zh' ? '港币汇率 / 汇率' : '홍콩달러 환율'} ({isManualRate ? (displayLang === 'zh' ? '手动' : '수동') : 'Naver'}): ₩{cnyRate.toFixed(2)}
                    <span style={{ fontSize: '9px', marginLeft: '4px', textDecoration: 'underline', opacity: 0.8 }}>
                      {displayLang === 'zh' ? '修改' : '수정'}
                    </span>
                  </span>
                )}
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
              <>
                {/* 카드 정렬 컨트롤 바 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {displayLang === 'zh' ? '排序:' : '정렬 기준:'}
                  </span>
                  <button
                    onClick={() => setHkCardSortMode('count')}
                    className={hkCardSortMode === 'count' ? styles.btnSave : styles.btnCancel}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: hkCardSortMode === 'count' ? 'none' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    {displayLang === 'zh' ? '按数量' : '개수 많은 순'}
                  </button>
                  <button
                    onClick={() => setHkCardSortMode('name')}
                    className={hkCardSortMode === 'name' ? styles.btnSave : styles.btnCancel}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: hkCardSortMode === 'name' ? 'none' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    {displayLang === 'zh' ? '按名称' : '기종 이름 순'}
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                  marginTop: '4px'
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
                            const availableGrades = Object.keys(g.grades || {});
                            if (availableGrades.length > 1) {
                              setCardBulkSaleGradeSelection({
                                modelName: g.modelName,
                                grades: availableGrades
                              });
                              setModalSelectedGrades(availableGrades);
                            } else {
                              openCardBulkSaleModal(g.modelName, availableGrades[0] || null);
                            }
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
            </>
                    ) : (
            <>
              {/* 2차 용량 필터 탭 바 */}
              {availableStorages.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  padding: '8px 16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '8px', fontWeight: 'bold' }}>
                    {displayLang === 'zh' ? '容量筛选:' : '용량 선택:'}
                  </span>
                  <button
                    onClick={() => setHkStorageFilter('all')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      backgroundColor: hkStorageFilter === 'all' ? 'var(--accent-light)' : 'transparent',
                      color: hkStorageFilter === 'all' ? '#000' : 'var(--text-secondary)',
                      fontWeight: hkStorageFilter === 'all' ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {displayLang === 'zh' ? '全部' : '전체'}
                  </button>
                  {availableStorages.map(storage => (
                    <button
                      key={storage}
                      onClick={() => setHkStorageFilter(storage)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        border: '1px solid var(--border-color)',
                        backgroundColor: hkStorageFilter === storage ? 'var(--accent-light)' : 'transparent',
                        color: hkStorageFilter === storage ? '#000' : 'var(--text-secondary)',
                        fontWeight: hkStorageFilter === storage ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      {storage}
                    </button>
                  ))}
                </div>
              )}

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
                      <th onClick={() => handleHKSort('storage')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {displayLang === 'zh' ? '容量' : '용량'} {renderSortIcon('storage')}
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
                      <th>{displayLang === 'zh' ? '等级' : '등급'}</th>
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
                        onUpdateGrade={handleUpdateGrade}
                        onEditClick={openEditDeviceModal}
                      />
                    ))}
                    {sortedHKItems.length === 0 && (
                      <tr>
                        <td colSpan={14} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                          {displayLang === 'zh' ? '没有香港入库의库存数据。请通过批量导入添加库存。' : '홍콩 입고된 재고 데이터가 없습니다. 대량 입고를 통해 재고를 추가해주세요.'}
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
            </>
            )}
          </div>
        )}

        {/* 판매 완료 승인 대기 탭 */}
        {activeTab === 'completed-sales' && (() => {
          const pendingDevices = hongkongInventory.filter(item => item.is_sold && !item.is_approved);
          const pendingRevenue = pendingDevices.reduce((sum, item) => sum + ((Number(item.selling_price) || 0) * (Number(item.sale_rate) || cnyRate)), 0);
          const pendingCost = pendingDevices.reduce((sum, item) => sum + (Number(item.purchase_cost) || 0), 0);
          const pendingMargin = pendingRevenue - pendingCost;
          const pendingMarginRate = pendingRevenue > 0 ? (pendingMargin / pendingRevenue) * 100 : 0;

          return (
            <div className="animate-fade-in">
              <div className={styles.headerRow}>
                <div>
                  <h2 className={styles.pageTitle}>판매 승인 관리 / 销售审批</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    판매원이 판매완료 처리한 기기들을 최종 승인하여 마진 및 정산 장부에 등록합니다.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => executeFinalApproval(selectedPendingIds)}
                    className={styles.btnSave}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    disabled={selectedPendingIds.length === 0}
                  >
                    <CheckCircle2 size={16} /> 선택 항목 최종 승인 / 最终审批 ({selectedPendingIds.length}건)
                  </button>
                  <button
                    onClick={() => executeCancelApproval(selectedPendingIds)}
                    className={styles.btnCancel}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      cursor: 'pointer',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: 'var(--danger-color)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                    disabled={selectedPendingIds.length === 0}
                  >
                    <XCircle size={16} /> 선택 항목 반려 / 批量驳回 ({selectedPendingIds.length}건)
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
                    <span className={styles.metricVal}>
                      ₩{Math.round(pendingRevenue).toLocaleString()}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        (HK${Math.round(pendingRevenue / cnyRate).toLocaleString()})
                      </span>
                    </span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                    <Coins size={22} />
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>예상 원가 합계 / 预计成本</span>
                    <span className={styles.metricVal}>
                      ₩{Math.round(pendingCost).toLocaleString()}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        (HK${Math.round(pendingCost / cnyRate).toLocaleString()})
                      </span>
                    </span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                    <Coins size={22} />
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>예상 마진 & 마진율 / 预计利润 & 利润率</span>
                    <span className={styles.metricVal} style={{ color: pendingMargin >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                      ₩{Math.round(pendingMargin).toLocaleString()}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        (HK${Math.round(pendingMargin / cnyRate).toLocaleString()})
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        ({pendingMarginRate.toFixed(1)}%)
                      </span>
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
              justifyContent: 'flex-end',
              alignItems: 'center',
              background: '#0f172a',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '12px',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
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
                      .map(item => {
                        const revenueKRW = (Number(item.selling_price) || 0) * (Number(item.sale_rate) || cnyRate);
                        const margin = revenueKRW - (Number(item.purchase_cost) || 0);
                        const rate = revenueKRW > 0 ? (margin / revenueKRW) * 100 : 0;
                        return (
                          <tr key={item.id}>
                            <td style={{ textAlign: 'center' }}>
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
                            </td>
                            <td>{item.sale_date || '-'}</td>
                            <td style={{ fontWeight: 'bold' }}>{item.seller_name || '-'}</td>
                            <td style={{ fontWeight: 'bold' }}>{getModelDisplayName(item.model_name)}</td>
                            <td style={{ fontFamily: 'monospace' }}>{item.imei?.startsWith('NO_IMEI-') ? '-' : item.imei}</td>
                            <td>{item.color || '-'}</td>
                            <td>
                              ₩{Number(item.purchase_cost || 0).toLocaleString()}
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                (HK${Math.round((Number(item.purchase_cost) || 0) / cnyRate).toLocaleString()})
                              </div>
                            </td>
                            <td style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>
                              HK${Number(item.selling_price || 0).toLocaleString()}
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                (₩{Math.round(revenueKRW).toLocaleString()})
                              </div>
                            </td>
                            <td style={{ color: margin >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                              ₩{Math.round(margin).toLocaleString()}
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                (HK${Math.round(margin / cnyRate).toLocaleString()})
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                ({rate.toFixed(1)}%)
                              </div>
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                color: 'var(--warning-color)'
                              }}>
                                최종 승인 대기 / 待审批
                              </span>
                            </td>
                            <td style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => executeFinalApproval([item.id])}
                                className={styles.btnSave}
                                style={{ padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}
                              >
                                {displayLang === 'zh' ? '审批' : '승인'}
                              </button>
                              <button
                                onClick={() => openEditSaleModal(item)}
                                className={styles.btnCancel}
                                style={{ padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}
                              >
                                {displayLang === 'zh' ? '编辑' : '수정'}
                              </button>
                              <button
                                onClick={() => executeCancelApproval([item.id])}
                                className={styles.btnCancel}
                                style={{ 
                                  padding: '6px 10px', 
                                  fontSize: '11px', 
                                  cursor: 'pointer',
                                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                  color: 'var(--danger-color)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}
                              >
                                {displayLang === 'zh' ? '驳回' : '반려'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {hongkongInventory
                      .filter(item => item.is_sold && !item.is_approved)
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
                          판매 승인 대기 중인 기기 내역이 없습니다.
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

        {activeTab === 'margin-settlement' && (() => {
          const baseSettledDevices = hongkongInventory
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

          const settledDevices = baseSettledDevices.filter(item => {
            if (settlementMonth !== 'All' && getYearMonth(item.sale_date || '') !== settlementMonth) return false;
            if (settlementMonth !== 'All' && selectedSettlementDays.length > 0) {
              const day = getDayFromDateStr(item.sale_date || '');
              if (day === null || !selectedSettlementDays.includes(day)) return false;
            }
            return true;
          });

          const sortedSettledDevices = [...settledDevices].sort((a, b) => {
            if (!settleSortColumn) return 0;
            
            let valA: any = '';
            let valB: any = '';
            
            switch (settleSortColumn) {
              case 'sale_date':
                valA = a.sale_date || '';
                valB = b.sale_date || '';
                break;
              case 'seller_name':
                valA = a.seller_name || '';
                valB = b.seller_name || '';
                break;
              case 'model_name':
                valA = getModelDisplayName(a.model_name) || '';
                valB = getModelDisplayName(b.model_name) || '';
                break;
              case 'imei':
                valA = a.imei || '';
                valB = b.imei || '';
                break;
              case 'purchase_cost':
                valA = Number(a.purchase_cost) || 0;
                valB = Number(b.purchase_cost) || 0;
                break;
              case 'selling_price':
                valA = Number(a.selling_price) || 0;
                valB = Number(b.selling_price) || 0;
                break;
              case 'margin': {
                const revA = (Number(a.selling_price) || 0) * (Number(a.sale_rate) || cnyRate);
                const marginA = revA - (Number(a.purchase_cost) || 0);
                const revB = (Number(b.selling_price) || 0) * (Number(b.sale_rate) || cnyRate);
                const marginB = revB - (Number(b.purchase_cost) || 0);
                valA = marginA;
                valB = marginB;
                break;
              }
              case 'margin_rate': {
                const revA = (Number(a.selling_price) || 0) * (Number(a.sale_rate) || cnyRate);
                const marginA = revA - (Number(a.purchase_cost) || 0);
                const rateA = revA > 0 ? (marginA / revA) * 100 : 0;
                
                const revB = (Number(b.selling_price) || 0) * (Number(b.sale_rate) || cnyRate);
                const marginB = revB - (Number(b.purchase_cost) || 0);
                const rateB = revB > 0 ? (marginB / revB) * 100 : 0;
                
                valA = rateA;
                valB = rateB;
                break;
              }
              default:
                break;
            }
            
            if (typeof valA === 'string' && typeof valB === 'string') {
              return settleSortDirection === 'asc' 
                ? valA.localeCompare(valB) 
                : valB.localeCompare(valA);
            } else {
              return settleSortDirection === 'asc' 
                ? (valA > valB ? 1 : valA < valB ? -1 : 0) 
                : (valB > valA ? 1 : valB < valA ? -1 : 0);
            }
          });

          // 차감 항목 필터링 및 집계
          const filteredDeductions = bulkSaleDeductions.filter(log => {
            if (settlementSeller !== 'All' && log.seller_name !== settlementSeller) return false;
            if (settlementMonth !== 'All' && getYearMonth(log.sale_date || '') !== settlementMonth) return false;
            if (settlementMonth !== 'All' && selectedSettlementDays.length > 0) {
              const day = getDayFromDateStr(log.sale_date || '');
              if (day === null || !selectedSettlementDays.includes(day)) return false;
            }
            return true;
          });

          const totalDeductionsKRW = filteredDeductions.reduce((sum, log) => sum + (Number(log.total_krw) || 0), 0);
          const totalDeductionsHKD = filteredDeductions.reduce((sum, log) => sum + (Number(log.total_hkd) || 0), 0);

          const totalRevenue = settledDevices.reduce((sum, item) => sum + ((Number(item.selling_price) || 0) * (Number(item.sale_rate) || cnyRate)), 0);
          const totalCost = settledDevices.reduce((sum, item) => sum + (Number(item.purchase_cost) || 0), 0);
          const totalMargin = totalRevenue - totalCost;
          
          // 실질 마진 및 실질 마진율 계산 (차감 반영)
          const netTotalMarginKRW = totalMargin - totalDeductionsKRW;
          const netAverageMarginRate = totalRevenue > 0 ? (netTotalMarginKRW / totalRevenue) * 100 : 0;
          const averageMarginRate = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

          // 판매완료 기종 카드 뷰용 그룹화 데이터
          const groupedSettled = settledDevices.reduce((acc: any[], item) => {
            const month = getYearMonth(item.sale_date || '');
            const model = item.model_name || 'UNKNOWN';
            const cleanModel = model.trim().toUpperCase();
            const foundPet = petNameMap.get(cleanModel);
            const petName = foundPet ? (displayLang === 'zh' ? foundPet.zh : foundPet.ko) : model;
            const key = `${month}_${petName}`;
            
            let existing = acc.find(x => x.key === key);
            if (!existing) {
              existing = {
                key,
                month,
                modelName: petName,
                count: 0,
                totalRevenue: 0,
                totalCost: 0,
                totalMargin: 0
              };
              acc.push(existing);
            }
            
            existing.count++;
            const rev = (Number(item.selling_price) || 0) * (Number(item.sale_rate) || cnyRate);
            existing.totalRevenue += rev;
            const cost = Number(item.purchase_cost) || 0;
            existing.totalCost += cost;
            existing.totalMargin += (rev - cost);
            
            return acc;
          }, []).sort((a: any, b: any) => {
            if (a.month !== b.month) return b.month.localeCompare(a.month);
            if (settlementCardSortMode === 'name') {
              const nameA = getModelDisplayName(a.modelName);
              const nameB = getModelDisplayName(b.modelName);
              return nameA.localeCompare(nameB);
            } else if (settlementCardSortMode === 'margin') {
              return b.totalMargin - a.totalMargin;
            }
            return b.count - a.count;
          });

          // 판매원 고유 목록 추출
          const sellersList = Array.from(new Set(
            hongkongInventory
              .filter(item => item.is_sold && item.is_approved && item.seller_name)
              .map(item => item.seller_name)
          ));

          // 판매완료 연/월 고유 목록 추출
          const monthsList = Array.from(new Set(
            hongkongInventory
              .filter(item => item.is_sold && item.is_approved && item.sale_date)
              .map(item => getYearMonth(item.sale_date || ''))
              .filter(m => m !== '기타/날짜없음')
          )).sort((a, b) => b.localeCompare(a));

          // 월별 요약 데이터 계산
          const monthlySummaries = (() => {
            const groups: Record<string, { month: string; revenue: number; cost: number; margin: number; count: number }> = {};
            baseSettledDevices.forEach(item => {
              const month = getYearMonth(item.sale_date || '');
              if (month === '기타/날짜없음') return;
              if (!groups[month]) {
                groups[month] = { month, revenue: 0, cost: 0, margin: 0, count: 0 };
              }
              const rev = (Number(item.selling_price) || 0) * (Number(item.sale_rate) || cnyRate);
              const cost = Number(item.purchase_cost) || 0;
              groups[month].revenue += rev;
              groups[month].cost += cost;
              groups[month].margin += (rev - cost);
              groups[month].count++;
            });
            return Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));
          })();

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
                    <span className={styles.metricVal}>
                      ₩{Math.round(totalRevenue).toLocaleString()}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        (HK${Math.round(totalRevenue / cnyRate).toLocaleString()})
                      </span>
                    </span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                    <Coins size={22} />
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>총 원가 / 总成本</span>
                    <span className={styles.metricVal}>
                      ₩{Math.round(totalCost).toLocaleString()}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        (HK${Math.round(totalCost / cnyRate).toLocaleString()})
                      </span>
                    </span>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                    <Coins size={22} />
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>
                      총 마진 및 평균 마진율 (차감 반영) / 总利润 & 利润率 (已扣除)
                    </span>
                    <span className={styles.metricVal}>
                      ₩{Math.round(netTotalMarginKRW).toLocaleString()}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        (HK${Math.round(netTotalMarginKRW / cnyRate).toLocaleString()})
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ({netAverageMarginRate.toFixed(1)}%)
                      </span>
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      기기 마진 / 毛利润: ₩{Math.round(totalMargin).toLocaleString()} (HK${Math.round(totalMargin / cnyRate).toLocaleString()}) | 총 차감액 / 扣除项: ₩{Math.round(totalDeductionsKRW).toLocaleString()} (HK${Math.round(totalDeductionsHKD).toLocaleString()})
                    </div>
                  </div>
                  <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
                    <CheckCircle2 size={22} />
                  </div>
                </div>
              </div>

              {/* 월별 요약 테이블 / 月度结算汇总 (전체 월 조회 시 노출) */}
              {settlementMonth === 'All' && monthlySummaries.length > 0 && (
                <div style={{
                  background: '#1e293b',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  marginBottom: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={16} style={{ color: 'var(--accent-light)' }} />
                    {displayLang === 'zh' ? '月度结算汇总' : '월별 정산 요약'}
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '12px'
                  }}>
                    {monthlySummaries.map(s => {
                      const marginRate = s.revenue > 0 ? (s.margin / s.revenue) * 100 : 0;
                      return (
                        <div key={s.month} style={{
                          backgroundColor: '#0f172a',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-light)' }}>{s.month}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.count}대 / 台</span>
                          </div>
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '销售额 / 매출액:' : '매출액 / 销售额:'}</span>
                            <span style={{ color: '#fff', fontWeight: '600', textAlign: 'right' }}>
                              ₩{Math.round(s.revenue).toLocaleString()}
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                (HK${Math.round(s.revenue / cnyRate).toLocaleString()})
                              </div>
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '利润 (率) / 마진 (율):' : '마진 (율) / 利润 (率):'}</span>
                            <span style={{ color: s.margin >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold', textAlign: 'right' }}>
                              ₩{Math.round(s.margin).toLocaleString()}
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                (HK${Math.round(s.margin / cnyRate).toLocaleString()})
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                ({marginRate.toFixed(1)}%)
                              </div>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
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

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>정산 월 필터 / 月份:</span>
                    <select
                      value={settlementMonth}
                      onChange={(e) => setSettlementMonth(e.target.value)}
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        color: '#fff',
                        fontSize: '12px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="All">{displayLang === 'zh' ? '全部月份' : '전체 월'}</option>
                      {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  
                  {settlementMonth !== 'All' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      width: '100%',
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {displayLang === 'zh' ? '选择日期 (多选):' : '일자 필터 (다중 선택 가능):'}
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {Array.from({ length: getDaysInMonth(settlementMonth) }, (_, i) => i + 1).map(day => {
                          const isSelected = selectedSettlementDays.includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSettlementDays(selectedSettlementDays.filter(d => d !== day));
                                } else {
                                  setSelectedSettlementDays([...selectedSettlementDays, day]);
                                }
                              }}
                              style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                borderRadius: '4px',
                                border: isSelected ? '1px solid var(--accent-light)' : '1px solid var(--border-color)',
                                backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                color: isSelected ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.1s'
                              }}
                            >
                              {day}{displayLang === 'zh' ? '日' : '일'}
                            </button>
                          );
                        })}
                        {selectedSettlementDays.length > 0 && (
                          <button
                            onClick={() => setSelectedSettlementDays([])}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: 'var(--danger-color)',
                              cursor: 'pointer'
                            }}
                          >
                            {displayLang === 'zh' ? '重置' : '초기화'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '视图:' : '보기:'}</span>
                    <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden' }}>
                      <button
                        onClick={() => setSettlementViewMode('list')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: 0,
                          cursor: 'pointer',
                          backgroundColor: settlementViewMode === 'list' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                          color: '#fff',
                          transition: 'all 0.2s'
                        }}
                      >
                        {displayLang === 'zh' ? '列表' : '리스트 표'}
                      </button>
                      <button
                        onClick={() => setSettlementViewMode('card')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: 0,
                          cursor: 'pointer',
                          backgroundColor: settlementViewMode === 'card' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                          color: '#fff',
                          transition: 'all 0.2s'
                        }}
                      >
                        {displayLang === 'zh' ? '卡片' : '기종 카드'}
                      </button>
                    </div>
                  </div>

                  {settlementViewMode === 'card' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '排序:' : '정렬:'}</span>
                      <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden' }}>
                        <button
                          onClick={() => setSettlementCardSortMode('count')}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            border: 'none',
                            borderRadius: 0,
                            cursor: 'pointer',
                            backgroundColor: settlementCardSortMode === 'count' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                            color: '#fff',
                            transition: 'all 0.2s'
                          }}
                        >
                          {displayLang === 'zh' ? '按数量' : '개수순'}
                        </button>
                        <button
                          onClick={() => setSettlementCardSortMode('name')}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            border: 'none',
                            borderRadius: 0,
                            cursor: 'pointer',
                            backgroundColor: settlementCardSortMode === 'name' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                            color: '#fff',
                            transition: 'all 0.2s'
                          }}
                        >
                          {displayLang === 'zh' ? '按名称' : '이름순'}
                        </button>
                        <button
                          onClick={() => setSettlementCardSortMode('margin')}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            border: 'none',
                            borderRadius: 0,
                            cursor: 'pointer',
                            backgroundColor: settlementCardSortMode === 'margin' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                            color: '#fff',
                            transition: 'all 0.2s'
                          }}
                        >
                          {displayLang === 'zh' ? '按利润' : '마진순'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '设备搜索:' : '기기 검색:'}</span>
                    <input
                      type="text"
                      placeholder={displayLang === 'zh' ? 'IMEI 或 机型' : 'IMEI 또는 모델명'}
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
              </div>

              {/* 상세 마진 테이블 / 기종 카드 */}
              {settlementViewMode === 'card' ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                  marginTop: '16px'
                }}>
                  {groupedSettled.map((g: any) => {
                    const displayName = getModelDisplayName(g.modelName);
                    const avgMargin = g.count > 0 ? g.totalMargin / g.count : 0;
                    return (
                      <div
                        key={g.key}
                        onClick={() => {
                          openBulkEditModal(g);
                        }}
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              {g.month}
                            </span>
                            <span style={{ fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              {g.count}대 판매완료
                            </span>
                          </div>
                          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>
                            {displayName}
                          </h3>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'monospace' }}>
                            {g.modelName}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{displayLang === 'zh' ? '总销售额:' : '총 매출액:'}</span>
                              <span style={{ color: '#fff', fontWeight: '600' }}>
                                ₩{Math.round(g.totalRevenue).toLocaleString()}
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '4px' }}>
                                  (HK${Math.round(g.totalRevenue / cnyRate).toLocaleString()})
                                </span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{displayLang === 'zh' ? '总成本:' : '총 원가:'}</span>
                              <span style={{ color: '#fff' }}>
                                ₩{g.totalCost.toLocaleString()}
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '4px' }}>
                                  (HK${Math.round(g.totalCost / cnyRate).toLocaleString()})
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <div>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px' }}>{displayLang === 'zh' ? '净利润' : '총 순마진'}</span>
                            <strong style={{ color: g.totalMargin >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '14px' }}>
                              ₩{Math.round(g.totalMargin).toLocaleString()}
                              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                (HK${Math.round(g.totalMargin / cnyRate).toLocaleString()})
                              </span>
                            </strong>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px' }}>{displayLang === 'zh' ? '平均单台利润' : '대당 평균마진'}</span>
                            <strong style={{ color: avgMargin >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                              ₩{Math.round(avgMargin).toLocaleString()}
                              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                (HK${Math.round(avgMargin / cnyRate).toLocaleString()})
                              </span>
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {groupedSettled.length === 0 && (
                    <div style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      padding: '60px 40px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)'
                    }}>
                      정산 조건에 맞는 판매 완료 내역이 없습니다.
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.tableSection}>
                  <div className={styles.tableWrapper}>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSettleSort('sale_date')}>
                            정산일자 / 结算日期 {renderSettleSortIcon('sale_date')}
                          </th>
                          <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSettleSort('seller_name')}>
                            판매원 / 销售员 {renderSettleSortIcon('seller_name')}
                          </th>
                          <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSettleSort('model_name')}>
                            모델명 / 机型 {renderSettleSortIcon('model_name')}
                          </th>
                          <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSettleSort('imei')}>
                            IMEI / 串号 {renderSettleSortIcon('imei')}
                          </th>
                          <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSettleSort('purchase_cost')}>
                            입고원가 / 成本 {renderSettleSortIcon('purchase_cost')}
                          </th>
                          <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSettleSort('selling_price')}>
                            판매가 / 售价 {renderSettleSortIcon('selling_price')}
                          </th>
                          <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSettleSort('margin')}>
                            순마진 / 利润 {renderSettleSortIcon('margin')}
                          </th>
                          <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSettleSort('margin_rate')}>
                            마진율 / 利润率 {renderSettleSortIcon('margin_rate')}
                          </th>
                          <th>상태</th>
                          <th>작업 / 操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSettledDevices.map(item => {
                          const revenueKRW = (Number(item.selling_price) || 0) * (Number(item.sale_rate) || cnyRate);
                          const margin = revenueKRW - (Number(item.purchase_cost) || 0);
                          const rate = revenueKRW > 0 ? (margin / revenueKRW) * 100 : 0;
                          return (
                            <tr key={item.id}>
                              <td>{item.sale_date || '-'}</td>
                              <td style={{ fontWeight: 'bold' }}>{item.seller_name || '-'}</td>
                              <td style={{ fontWeight: 'bold' }}>{getModelDisplayName(item.model_name)}</td>
                              <td style={{ fontFamily: 'monospace' }}>{item.imei?.startsWith('NO_IMEI-') ? '-' : item.imei}</td>
                              <td>
                                ₩{Number(item.purchase_cost || 0).toLocaleString()}
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                  (HK${Math.round((Number(item.purchase_cost) || 0) / cnyRate).toLocaleString()})
                                </div>
                              </td>
                              <td style={{ color: 'var(--accent-light)', fontWeight: 'bold' }}>
                                HK${Number(item.selling_price || 0).toLocaleString()}
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                  (₩{Math.round(revenueKRW).toLocaleString()})
                                </div>
                              </td>
                              <td style={{ color: margin >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                                ₩{Math.round(margin).toLocaleString()}
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                  (HK${Math.round(margin / cnyRate).toLocaleString()})
                                </div>
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
                              <td style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => openEditSaleModal(item)}
                                  className={styles.btnCancel}
                                  style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  {displayLang === 'zh' ? '编辑' : '수정'}
                                </button>
                                <button
                                  onClick={() => executeCancelSettledApproval([item.id])}
                                  className={styles.btnCancel}
                                  style={{ 
                                    padding: '4px 8px', 
                                    fontSize: '11px', 
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    color: 'var(--danger-color)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                  }}
                                >
                                  {displayLang === 'zh' ? '取消审批' : '승인 취소'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {sortedSettledDevices.length === 0 && (
                          <tr>
                            <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                              정산 조건에 맞는 판매 내역이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 차감 내역 테이블 */}
              <div style={{
                background: '#1e293b',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '16px',
                marginTop: '20px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MinusCircle size={16} style={{ color: 'var(--danger-color)' }} />
                  {displayLang === 'zh' ? '批量销售 扣除明细' : '일괄 판매 차감 적용 내역'}
                </h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>{displayLang === 'zh' ? '销售日期' : '판매 일자'}</th>
                        <th>{displayLang === 'zh' ? '销售员' : '판매원'}</th>
                        <th>{displayLang === 'zh' ? '销售明细' : '판매 내역'}</th>
                        <th>{displayLang === 'zh' ? '扣除原因' : '차감 항목'}</th>
                        <th style={{ textAlign: 'center' }}>{displayLang === 'zh' ? '数量' : '수량'}</th>
                        <th style={{ textAlign: 'right' }}>{displayLang === 'zh' ? '单价' : '차감 단가'}</th>
                        <th style={{ textAlign: 'right' }}>{displayLang === 'zh' ? '总计' : '총 차감액'}</th>
                        <th>{displayLang === 'zh' ? '操作' : '작업'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeductions.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            {displayLang === 'zh' ? '在此筛选条件下无扣除记录。' : '해당 필터 조건 하에 차감 내역이 없습니다.'}
                          </td>
                        </tr>
                      ) : (
                        filteredDeductions.map(log => {
                          const unitPriceDisp = `HK$${Number(log.amount_hkd).toLocaleString()} (₩${Math.round(Number(log.amount_hkd) * (Number(log.exchange_rate) || cnyRate)).toLocaleString()})`;
                          const totalDisp = `HK$${Number(log.total_hkd).toLocaleString()} (₩${Number(log.total_krw).toLocaleString()})`;
                          
                          return (
                            <tr key={log.id}>
                              <td>{log.sale_date}</td>
                              <td style={{ fontWeight: 'bold' }}>{log.seller_name || '-'}</td>
                              <td style={{ color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.sold_summary}>
                                {log.sold_summary || '-'}
                              </td>
                              <td style={{ fontWeight: 'bold', color: 'var(--warning-color)' }}>
                                {displayLang === 'zh' ? log.name_zh : log.name_ko}
                              </td>
                              <td style={{ textAlign: 'center' }}>{log.quantity}대 / 台</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{unitPriceDisp}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--danger-color)' }}>-{totalDisp}</td>
                              <td style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => openEditDeductionModal(log)}
                                  className={styles.btnCancel}
                                  style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  {displayLang === 'zh' ? '编辑' : '수정'}
                                </button>
                                <button
                                  onClick={() => executeDeleteDeduction(log.id)}
                                  className={styles.btnCancel}
                                  style={{ 
                                    padding: '4px 8px', 
                                    fontSize: '11px', 
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    color: 'var(--danger-color)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                  }}
                                >
                                  {displayLang === 'zh' ? '删除' : '삭제'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 차감 항목 관리 탭 제거 */}

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

        {/* 메뉴 권한 설정 탭 */}
        {activeTab === 'permissions' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <div>
                <h2 className={styles.pageTitle}>메뉴 권한 관리 / 菜单权限管理</h2>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  각 회원 등급별 좌측 메뉴 노출 여부를 체크박스로 설정할 수 있습니다.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleResetPermissions}
                  className={styles.btnCancel}
                  style={{ cursor: 'pointer', padding: '10px 18px', border: '1px solid var(--border-color)', background: 'transparent' }}
                >
                  기본값 복원 / 恢复默认
                </button>
                <button
                  onClick={handleSavePermissions}
                  className={styles.btnSave}
                  style={{ cursor: 'pointer' }}
                >
                  권한 저장 / 保存权限
                </button>
              </div>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px 16px' }}>메뉴 명칭 / 菜单名称</th>
                      <th style={{ textAlign: 'center', padding: '14px 16px' }}>어드민 / Admin</th>
                      <th style={{ textAlign: 'center', padding: '14px 16px' }}>매니저 / Manager</th>
                      <th style={{ textAlign: 'center', padding: '14px 16px' }}>스탭 / Staff</th>
                      <th style={{ textAlign: 'center', padding: '14px 16px' }}>일반 / User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MENU_KEYS.map(menu => (
                      <tr key={menu.key}>
                        <td style={{ fontWeight: 'bold', padding: '14px 16px' }}>
                          {menu.label}
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                          <input
                            type="checkbox"
                            checked={tempPermissions.admin?.[menu.key] || false}
                            onChange={(e) => handlePermissionChange('admin', menu.key, e.target.checked)}
                            disabled={menu.key === 'permissions'} // 어드민의 권한설정 메뉴는 해제 불가
                            style={{ width: '18px', height: '18px', cursor: menu.key === 'permissions' ? 'not-allowed' : 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                          <input
                            type="checkbox"
                            checked={tempPermissions.manager?.[menu.key] || false}
                            onChange={(e) => handlePermissionChange('manager', menu.key, e.target.checked)}
                            disabled={menu.key === 'permissions'}
                            style={{ width: '18px', height: '18px', cursor: menu.key === 'permissions' ? 'not-allowed' : 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                          <input
                            type="checkbox"
                            checked={tempPermissions.staff?.[menu.key] || false}
                            onChange={(e) => handlePermissionChange('staff', menu.key, e.target.checked)}
                            disabled={menu.key === 'permissions'}
                            style={{ width: '18px', height: '18px', cursor: menu.key === 'permissions' ? 'not-allowed' : 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                          <input
                            type="checkbox"
                            checked={tempPermissions.general?.[menu.key] || false}
                            onChange={(e) => handlePermissionChange('general', menu.key, e.target.checked)}
                            disabled={menu.key === 'permissions'}
                            style={{ width: '18px', height: '18px', cursor: menu.key === 'permissions' ? 'not-allowed' : 'pointer' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 회원 등급 관리 탭 */}
        {activeTab === 'members' && (
          <div className="animate-fade-in">
            <div className={styles.headerRow}>
              <div>
                <h2 className={styles.pageTitle}>회원 권한 등급 관리 / 会员管理</h2>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  가입된 회원들의 이름, PIN, 권한 등급을 수정하거나 삭제할 수 있습니다.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {displayLang === 'zh' ? '搜索:' : '검색:'}
                </span>
                <input 
                  type="text" 
                  placeholder={displayLang === 'zh' ? '姓名 或 电话号码' : '이름 또는 전화번호'}
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    color: '#fff',
                    outline: 'none',
                    width: '200px'
                  }}
                />
              </div>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px 16px' }}>이름 / 姓名</th>
                      <th style={{ padding: '14px 16px' }}>전화번호 / 电话</th>
                      <th style={{ textAlign: 'center', padding: '14px 16px' }}>PIN / 密码</th>
                      <th style={{ textAlign: 'center', padding: '14px 16px' }}>등급 / 角色</th>
                      <th style={{ padding: '14px 16px' }}>주소 / 地址</th>
                      <th style={{ textAlign: 'center', padding: '14px 16px' }}>가입일 / 注册日期</th>
                      <th style={{ textAlign: 'center', padding: '14px 16px' }}>작업 / 操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map(m => (
                        <MemberRow 
                          key={m.id}
                          member={m}
                          displayLang={displayLang}
                          onUpdate={handleUpdateMember}
                          onDelete={handleDeleteMember}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                          {displayLang === 'zh' ? '没有找到匹配的会员。' : '검색 조건에 일치하는 회원이 없습니다.'}
                        </td>
                      </tr>
                    )}
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
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-light)' }}>{formatCurrency(selectedTradeIn.estimated_price, 'KRW')}</span>
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
              {(() => {
                const largeCats = categories.filter(c => !c.parent_id);
                const selectedLargeObj = categories.find(c => c.name === prodCategory && !c.parent_id);
                const middleCats = selectedLargeObj ? categories.filter(c => c.parent_id === selectedLargeObj.id) : [];
                const selectedMiddleObj = selectedLargeObj ? categories.find(c => c.name === prodBrand && c.parent_id === selectedLargeObj.id) : null;
                const smallCats = selectedMiddleObj ? categories.filter(c => c.parent_id === selectedMiddleObj.id) : [];

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label htmlFor="prodCategorySelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>기종 카테고리 (대분류)</label>
                        <select 
                          id="prodCategorySelect"
                          value={prodCategory} 
                          onChange={(e) => handleProdCategoryChange(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                        >
                          {largeCats.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          {largeCats.length === 0 && <option value="스마트폰">스마트폰</option>}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label htmlFor="brandSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>제조사 (중분류)</label>
                        <select 
                          id="brandSelect"
                          value={prodBrand} 
                          onChange={(e) => handleProdBrandChange(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                        >
                          {middleCats.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          <option value="기타">기타</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label htmlFor="prodSeriesInput" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>시리즈 (소분류)</label>
                        <select 
                          id="prodSeriesInput"
                          value={prodSeries} 
                          onChange={(e) => setProdSeries(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                        >
                          {smallCats.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          <option value="기타">기타</option>
                        </select>
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
                  </>
                );
              })()}

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="prodStatusSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>판매 상태</label>
                  <select 
                    id="prodStatusSelect"
                    value={prodStatus} 
                    onChange={(e) => setProdStatus(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  >
                    <option value="available">판매중 (available)</option>
                    <option value="reserved">예약중 (reserved)</option>
                    <option value="sold">품절 (판매완료) (sold)</option>
                  </select>
                </div>
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
              {(() => {
                const largeCats = categories.filter(c => !c.parent_id);
                const selectedLargeObj = categories.find(c => c.name === ruleCategory && !c.parent_id);
                const middleCats = selectedLargeObj ? categories.filter(c => c.parent_id === selectedLargeObj.id) : [];
                const selectedMiddleObj = selectedLargeObj ? categories.find(c => c.name === ruleBrand && c.parent_id === selectedLargeObj.id) : null;
                const smallCats = selectedMiddleObj ? categories.filter(c => c.parent_id === selectedMiddleObj.id) : [];

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label htmlFor="ruleCategorySelect" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>기종 카테고리 (대분류)</label>
                        <select 
                          id="ruleCategorySelect"
                          value={ruleCategory} 
                          onChange={(e) => handleRuleCategoryChange(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                        >
                          {largeCats.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          {largeCats.length === 0 && <option value="스마트폰">스마트폰</option>}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label htmlFor="ruleBrandSelect" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>제조사 (중분류)</label>
                        <select 
                          id="ruleBrandSelect"
                          value={ruleBrand} 
                          onChange={(e) => handleRuleBrandChange(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                        >
                          {middleCats.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          <option value="기타">기타</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label htmlFor="ruleSeriesInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>시리즈 (소분류)</label>
                        <select 
                          id="ruleSeriesInput"
                          value={ruleSeries} 
                          onChange={(e) => setRuleSeries(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                        >
                          {smallCats.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          <option value="기타">기타</option>
                        </select>
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
                  </>
                );
              })()}

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
              {/* 분류 단계 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>분류 단계</label>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px', 
                  padding: '10px', 
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  {catLevel === 'large' && '대분류 (스마트폰, 태블릿 등)'}
                  {catLevel === 'middle' && '중분류 (제조사)'}
                  {catLevel === 'small' && '소분류 (시리즈)'}
                </div>
              </div>

              {/* 상위 경로 표시 */}
              {(catLevel === 'middle' || catLevel === 'small') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>상위 카테고리 경로</label>
                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '6px', 
                    padding: '10px', 
                    color: 'var(--accent-light)',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {catLevel === 'middle' 
                      ? (catParentLargeName || '지정되지 않음')
                      : `${catParentLargeName || '지정되지 않음'} > ${catParentMiddleName || '지정되지 않음'}`
                    }
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="catNameInput" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>카테고리 이름</label>
                <input 
                  id="catNameInput"
                  type="text" 
                  placeholder="예: 스마트폰, Apple, 아이폰 15 시리즈..."
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                  required
                />
              </div>

              {catLevel === 'large' && (
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
              )}
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
                  placeholder="예시:&#10;Sticker&#9;Date&#9;Model&#9;IMEI&#9;Color&#9;Cost&#9;Price&#9;Location&#9;Grade&#10;SN001&#9;24-06-10&#9;아이폰 15&#9;35829381&#9;Black&#9;450&#9;550&#9;HK-A&#9;LCD"
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
                            <th>등급</th>
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

      {/* 재고 통계 모달 */}
      {isInventoryStatsModalOpen && (() => {
        const stats = inventoryStats;
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}>
            <div className={styles.modalContent} style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '14px',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={20} style={{ color: 'var(--accent-light)' }} />
                  {displayLang === 'zh' ? '库存资产价值与统计 / 库存统计' : '재고 자산 가치 및 통계'}
                </h3>
                <button
                  onClick={() => setIsInventoryStatsModalOpen(false)}
                  style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label="닫기"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 통계 기준 토글 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0f172a',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {displayLang === 'zh' ? '统计基准:' : '통계 기준:'}
                  </span>
                  <button
                    onClick={() => setInventoryStatsBasis('all')}
                    className={inventoryStatsBasis === 'all' ? styles.btnSave : styles.btnCancel}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      border: inventoryStatsBasis === 'all' ? 'none' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    {displayLang === 'zh' ? '全部库存' : '전체 재고 기준 (입고 기준)'}
                  </button>
                  <button
                    onClick={() => setInventoryStatsBasis('available')}
                    className={inventoryStatsBasis === 'available' ? styles.btnSave : styles.btnCancel}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      border: inventoryStatsBasis === 'available' ? 'none' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    {displayLang === 'zh' ? '可用库存' : '가용 실재고 기준 (판매 대기)'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '总数量:' : '총 수량:'}</span>{' '}
                    <strong style={{ color: '#fff' }}>{stats.totalCount}대 / 台</strong>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{displayLang === 'zh' ? '总资产价值 (成本):' : '총 자산 가치 (원가):'}</span>{' '}
                    <strong style={{ color: 'var(--success-color)' }}>₩{Math.round(stats.totalCost).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* 그리드 분할 레이아웃 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '24px'
              }}>
                {/* 좌측: 모델별 통계 */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-light)', marginBottom: '10px' }}>
                    📊 {displayLang === 'zh' ? '按机型资产统计 / 机型统计' : '모델별 재고 자산 요약'}
                  </h4>
                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-tertiary)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#fff' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px' }}>{displayLang === 'zh' ? '机型' : '모델명'}</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>{displayLang === 'zh' ? '数量' : '수량'}</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>{displayLang === 'zh' ? '总成本' : '원가 합계'}</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>{displayLang === 'zh' ? '价值比' : '비중'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.modelsList.map(m => {
                          const costPct = stats.totalCost > 0 ? (m.cost / stats.totalCost) * 100 : 0;
                          return (
                            <tr key={m.modelName} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{getModelDisplayName(m.modelName)}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>{m.count}대</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold' }}>₩{Math.round(m.cost).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{costPct.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 우측: 기종별 등급 세부 요약 */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-light)', marginBottom: '10px' }}>
                    📊 {displayLang === 'zh' ? '按机型 & 等级细分 / 细分统计' : '기종별 등급 세부 요약'}
                  </h4>
                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-tertiary)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#fff' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px' }}>{displayLang === 'zh' ? '机型' : '모델명'}</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>{displayLang === 'zh' ? '等级' : '등급'}</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>{displayLang === 'zh' ? '数量' : '수량'}</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>{displayLang === 'zh' ? '总成本' : '원가 합계'}</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>{displayLang === 'zh' ? '价值比' : '비중'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.modelGradesList.map(mg => {
                          const costPct = stats.totalCost > 0 ? (mg.cost / stats.totalCost) * 100 : 0;
                          return (
                            <tr key={`${mg.modelName}_${mg.grade}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{getModelDisplayName(mg.modelName)}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  backgroundColor: mg.grade === '공란' || mg.grade === '无' ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.1)',
                                  color: mg.grade === '공란' || mg.grade === '无' ? 'var(--text-muted)' : 'var(--primary-color)'
                                }}>
                                  {mg.grade}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>{mg.count}대</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold' }}>₩{Math.round(mg.cost).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{costPct.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '14px',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => setIsInventoryStatsModalOpen(false)}
                  className={styles.btnCancel}
                  style={{ padding: '8px 20px', fontSize: '13px', cursor: 'pointer' }}
                >
                  {displayLang === 'zh' ? '关闭' : '닫기'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                    const availableHKDevices = isSellSelectedOnly 
                      ? hongkongInventory.filter(x => !x.is_sold && selectedHKIds.includes(x.id))
                      : hongkongInventory.filter(x => !x.is_sold);
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
                                      flexDirection: 'column',
                                      gap: '4px',
                                      fontSize: '11px',
                                      padding: '8px 12px',
                                      backgroundColor: isUnsold ? 'rgba(245, 158, 11, 0.08)' : 'rgba(30, 41, 59, 0.4)',
                                      borderRadius: '8px',
                                      border: isUnsold ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
                                      opacity: isModelSelected ? 1 : 0.5,
                                      cursor: isModelSelected ? 'pointer' : 'default',
                                      userSelect: 'none',
                                      width: '100%',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                        <span style={{ color: isUnsold ? 'var(--warning-color)' : 'var(--success-color)', fontWeight: 'bold', fontSize: '11px' }}>
                                          {isUnsold ? (displayLang === 'zh' ? '排除未售' : '★ 미판매 제외') : (displayLang === 'zh' ? '确认销售' : '판매 완료')}
                                        </span>
                                      </div>
                                      <span style={{
                                        fontSize: '10px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        color: '#fff',
                                        fontWeight: 'bold'
                                      }}>
                                        {dev.notes || (displayLang === 'zh' ? '无等级' : '등급 없음')}
                                      </span>
                                    </div>
                                    
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.03)', margin: '2px 0' }} />
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                      <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Sticker:</span> <strong style={{ color: '#fff' }}>{dev.sticker || '-'}</strong>
                                      </div>
                                      <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Color:</span> <strong style={{ color: '#fff' }}>{dev.color || '-'}</strong>
                                      </div>
                                      <div style={{ gridColumn: 'span 2' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>IMEI:</span> <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{dev.imei?.startsWith('NO_IMEI-') ? '-' : dev.imei}</strong>
                                      </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                                      <span>Battery: {dev.battery_pct}%</span>
                                      <span>{formatCurrency(dev.purchase_cost, 'KRW')}</span>
                                    </div>
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

              {/* 차감 항목 적용 입력부 (수동 입력 방식) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  {displayLang === 'zh' ? '应用扣除项 / 차감 항목 적용 (수동 입력)' : '차감 항목 적용 (수동 입력):'}
                </span>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {displayLang === 'zh' ? '扣除原因 / 차감 사유' : '차감 사유 / 扣除原因'}
                    </label>
                    <input
                      type="text"
                      placeholder={displayLang === 'zh' ? '输入扣除原因 (例如: 屏幕划痕)' : '차감 사유를 입력하세요 (예: 액정 기스)'}
                      value={customDeductionName}
                      onChange={(e) => setCustomDeductionName(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {displayLang === 'zh' ? '扣除金额 / 차감 금액 (HKD)' : '차감 금액 / 扣除金额 (HKD)'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <input
                          type="number"
                          placeholder="0"
                          value={customDeductionAmountHkd}
                          onChange={(e) => setCustomDeductionAmountHkd(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff', flex: 1 }}
                        />
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>HK$</span>
                      </div>
                      {Number(customDeductionAmountHkd) > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '100px' }}>
                          ≒ ₩{Math.round(Number(customDeductionAmountHkd) * cnyRate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 실시간 정산 및 차감 계산 요약 (테이블 뷰) */}
              {(() => {
                const availableHKDevices = isSellSelectedOnly
                  ? hongkongInventory.filter(x => !x.is_sold && selectedHKIds.includes(x.id))
                  : hongkongInventory.filter(x => !x.is_sold);
                const candidateDevices = availableHKDevices.filter(x => selectedBulkModels.includes(x.model_name));
                const soldDevices = candidateDevices.filter(x => !unsoldBulkDeviceIds.includes(x.id));

                if (soldDevices.length === 0) return null;

                const totalCostKRW = soldDevices.reduce((sum, d) => sum + (Number(d.purchase_cost) || 0), 0);
                const totalSellingPriceHKD = soldDevices.reduce((sum, d) => {
                  const unitPrice = Number(bulkSellingPrices[d.model_name]) || 0;
                  return sum + unitPrice;
                }, 0);
                const totalSellingPriceKRW = totalSellingPriceHKD * cnyRate;
                const totalMarginKRW = totalSellingPriceKRW - totalCostKRW;
                
                const totalDeductionsHKD = Number(customDeductionAmountHkd) || 0;
                const totalDeductionsKRW = totalDeductionsHKD * cnyRate;
                const netMarginKRW = totalMarginKRW - totalDeductionsKRW;
                const avgMarginKRW = soldDevices.length > 0 ? totalMarginKRW / soldDevices.length : 0;
                const avgNetMarginKRW = soldDevices.length > 0 ? netMarginKRW / soldDevices.length : 0;

                return (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '12px',
                    marginTop: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>{displayLang === 'zh' ? '所选设备:' : '선택된 기기:'}</span>
                      <strong style={{ color: '#fff' }}>{soldDevices.length}대</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>{displayLang === 'zh' ? '总成本 (KRW):' : '총 원가 / 总成本 (KRW):'}</span>
                      <span style={{ color: '#fff', fontWeight: '500' }}>
                        ₩{totalCostKRW.toLocaleString()}
                        <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          (HK${Math.round(totalCostKRW / cnyRate).toLocaleString()})
                        </span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>{displayLang === 'zh' ? '总售价 (HKD):' : '총 판매가 / 총 판매 (HKD):'}</span>
                      <span style={{ color: 'var(--accent-light)', fontWeight: 'bold' }}>
                        HK${totalSellingPriceHKD.toLocaleString()}
                        <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          (₩{Math.round(totalSellingPriceKRW).toLocaleString()})
                        </span>
                      </span>
                    </div>
                    {totalDeductionsHKD > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-color)' }}>
                        <span>{displayLang === 'zh' ? '总扣除 (HKD):' : '총 차감액 / 총 차감 (HKD):'}</span>
                        <span style={{ fontWeight: 'bold' }}>
                          -HK${totalDeductionsHKD.toLocaleString()}
                          <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                            (-₩{Math.round(totalDeductionsKRW).toLocaleString()})
                          </span>
                        </span>
                      </div>
                    )}
                    <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                    
                    {totalDeductionsHKD > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#fff' }}>{displayLang === 'zh' ? '扣除后净利润:' : '차감 후 순마진 / 扣除后净利润:'}</span>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: netMarginKRW >= 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                          }}>
                            {netMarginKRW >= 0 ? '+' : ''}₩{Math.round(netMarginKRW).toLocaleString()}
                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                              (HK${Math.round(netMarginKRW / cnyRate).toLocaleString()})
                            </span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#fff' }}>{displayLang === 'zh' ? '单台平均净利润:' : '대당 평균 순마진 / 단태평균정이윤:'}</span>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: avgNetMarginKRW >= 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                          }}>
                            {avgNetMarginKRW >= 0 ? '+' : ''}₩{Math.round(avgNetMarginKRW).toLocaleString()}
                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                              (HK${Math.round(avgNetMarginKRW / cnyRate).toLocaleString()})
                            </span>
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#fff' }}>{displayLang === 'zh' ? '预估总利润:' : '예상 총 마진 / 预估总利润:'}</span>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: totalMarginKRW >= 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                          }}>
                            {totalMarginKRW >= 0 ? '+' : ''}₩{Math.round(totalMarginKRW).toLocaleString()}
                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                              (HK${Math.round(totalMarginKRW / cnyRate).toLocaleString()})
                            </span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: '#fff' }}>{displayLang === 'zh' ? '单台平均利润:' : '대당 평균 마진 / 단태평균이윤:'}</span>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: avgMarginKRW >= 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                          }}>
                            {avgMarginKRW >= 0 ? '+' : ''}₩{Math.round(avgMarginKRW).toLocaleString()}
                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                              (HK${Math.round(avgMarginKRW / cnyRate).toLocaleString()})
                            </span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className={styles.btnGroup}>
              <button onClick={() => { setIsBulkSaleModalOpen(false); setCustomDeductionName(''); setCustomDeductionAmountHkd(''); }} className={styles.btnCancel}>취소</button>
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

      {/* 등급 선택 모달 */}
      {cardBulkSaleGradeSelection && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px', width: '90%', backgroundColor: '#1e293b', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0, fontSize: '16px' }}>
                {displayLang === 'zh' ? '选择销售等级' : '판매할 등급 선택'}
              </h3>
              <button onClick={() => setCardBulkSaleGradeSelection(null)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0', lineHeight: '1.4' }}>
                {displayLang === 'zh' 
                  ? `"${getModelDisplayName(cardBulkSaleGradeSelection.modelName)}" 含有多个等级。请选择要销售의 等级:` 
                  : `"${getModelDisplayName(cardBulkSaleGradeSelection.modelName)}" 에 여러 등급이 섞여 있습니다. 판매할 등급을 선택하세요:`}
              </p>

              {/* 전체 선택 토글 */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '10px 12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#fff',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={modalSelectedGrades.length === cardBulkSaleGradeSelection.grades.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setModalSelectedGrades(cardBulkSaleGradeSelection.grades);
                    } else {
                      setModalSelectedGrades([]);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold' }}>
                  {displayLang === 'zh' ? '全选 (전체 선택)' : '전체 선택'}
                </span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {cardBulkSaleGradeSelection.grades.map(grade => {
                  const modelGroup = groupedHKModels.find(gm => gm.modelName === cardBulkSaleGradeSelection.modelName);
                  const count = modelGroup?.grades?.[grade] || 0;
                  const isChecked = modalSelectedGrades.includes(grade);

                  return (
                    <label
                      key={grade}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-tertiary)',
                        border: isChecked ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#fff',
                        userSelect: 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModalSelectedGrades([...modalSelectedGrades, grade]);
                            } else {
                              setModalSelectedGrades(modalSelectedGrades.filter(g => g !== grade));
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{grade}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--accent-light)' }}>{count}대</span>
                    </label>
                  );
                })}
              </div>

              <button
                disabled={modalSelectedGrades.length === 0}
                onClick={() => {
                  const selModel = cardBulkSaleGradeSelection.modelName;
                  setCardBulkSaleGradeSelection(null);
                  openCardBulkSaleModal(selModel, modalSelectedGrades);
                }}
                className={styles.btnSave}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginTop: '8px',
                  cursor: modalSelectedGrades.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: modalSelectedGrades.length === 0 ? 0.5 : 1
                }}
              >
                {displayLang === 'zh' ? '选择销售进行 (판매 진행)' : '선택한 등급으로 판매 진행'}
              </button>
            </div>
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
                {cardBulkSaleGrades && cardBulkSaleGrades.length > 0 ? ` [${cardBulkSaleGrades.join(', ')}]` : ` [${displayLang === 'zh' ? '所有等级' : '전체 등급'}]`}
              </h3>
              <button onClick={() => { setCardBulkSaleModel(null); setCardBulkSaleGrades(null); setCustomDeductionName(''); setCustomDeductionAmountHkd(''); }} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="닫기">
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
                  {displayLang === 'zh' ? '输入贴纸号(5位)或 IMEI 排除' : '제외할 스티커 번호(5자리) 또는 IMEI 입력'}
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    ref={stickerInputRef}
                    type="text"
                    placeholder={displayLang === 'zh' ? '贴纸号(5位)或 IMEI' : '스티커(5자리) 또는 IMEI'}
                    value={stickerInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (stickerTimeoutRef.current) {
                          clearTimeout(stickerTimeoutRef.current);
                        }
                        processExclusion(stickerInput);
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setStickerInput(val);
                      
                      if (stickerTimeoutRef.current) {
                        clearTimeout(stickerTimeoutRef.current);
                      }

                      // 15자리 IMEI는 즉시 처리
                      if (val.length === 15) {
                        processExclusion(val);
                        return;
                      }
                      
                      // 5자리 스티커 번호는 바코드 스캐너의 연속 입력을 방해하지 않기 위해 50ms 대기 후 처리
                      if (val.length === 5) {
                        stickerTimeoutRef.current = setTimeout(() => {
                          processExclusion(val);
                        }, 50);
                      }
                    }}
                    autoFocus
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '2px solid #2563eb',
                      borderRadius: '6px',
                      padding: '12px',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      width: '260px',
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
                  {displayLang === 'zh'
                    ? '* 在右侧键盘 or 条码扫描器中输入5位贴纸号(无需回车即排除) 或 输入/扫描 IMEI 并按回车即可快速排除。'
                    : '* 키패드에서 엔터 없이 5자리 스티커 번호만 입력하여 즉시 제외하거나, 15자리 IMEI를 입력/스캔하여 즉시 제외할 수 있습니다 (엔터키로도 제외 가능).'}
                </span>
                {(() => {
                  const targetModelNames = new Set<string>();
                  if (cardBulkSaleModel) {
                    targetModelNames.add(cardBulkSaleModel.trim().toUpperCase());
                    for (const [modelCode, petInfo] of petNameMap.entries()) {
                      if (
                        petInfo.ko.trim() === cardBulkSaleModel.trim() ||
                        petInfo.zh.trim() === cardBulkSaleModel.trim()
                      ) {
                        targetModelNames.add(modelCode.toUpperCase());
                        if (modelCode.toUpperCase().startsWith('SM-')) {
                          targetModelNames.add(modelCode.toUpperCase().substring(3));
                        } else {
                          targetModelNames.add('SM-' + modelCode.toUpperCase());
                        }
                      }
                    }
                  }
                  const matchedNoGrade = hongkongInventory.filter(x => {
                    const modelClean = (x.model_name || '').trim().toUpperCase();
                    const isModelMatch = targetModelNames.has(modelClean) || 
                      (modelClean.startsWith('SM-') && targetModelNames.has(modelClean.substring(3))) ||
                      (!modelClean.startsWith('SM-') && targetModelNames.has('SM-' + modelClean));
                    return isModelMatch && !x.is_sold;
                  });
                  const exampleGrades = matchedNoGrade.slice(0, 5).map(x => `${x.sticker || 'NoSticker'}:${x.notes || 'NoGrade'}`).join(', ');
                  return (
                    <div style={{ fontSize: '10px', color: 'rgba(239, 68, 68, 0.8)', marginTop: '8px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      [디버그] 모델: {cardBulkSaleModel} | 타겟모델코드Set: {Array.from(targetModelNames).join(',')} | 
                      기종일치(등급무관) 대수: {matchedNoGrade.length}대 |
                      실제기기 등급예시: {exampleGrades || '없음'}
                    </div>
                  );
                })()}
              </div>

              {/* 통계 요약 */}
              {(() => {
                const targetModelNames = new Set<string>();
                if (cardBulkSaleModel) {
                  targetModelNames.add(cardBulkSaleModel.trim().toUpperCase());
                  for (const [modelCode, petInfo] of petNameMap.entries()) {
                    if (
                      petInfo.ko.trim() === cardBulkSaleModel.trim() ||
                      petInfo.zh.trim() === cardBulkSaleModel.trim()
                    ) {
                      targetModelNames.add(modelCode.toUpperCase());
                      if (modelCode.toUpperCase().startsWith('SM-')) {
                        targetModelNames.add(modelCode.toUpperCase().substring(3));
                      } else {
                        targetModelNames.add('SM-' + modelCode.toUpperCase());
                      }
                    }
                  }
                }

                const availableHKDevices = hongkongInventory.filter(x => {
                  const modelClean = (x.model_name || '').trim().toUpperCase();
                  const isModelMatch = targetModelNames.has(modelClean) || 
                    (modelClean.startsWith('SM-') && targetModelNames.has(modelClean.substring(3))) ||
                    (!modelClean.startsWith('SM-') && targetModelNames.has('SM-' + modelClean));

                  return (
                    isModelMatch && 
                    !x.is_sold &&
                    (!cardBulkSaleGrades || cardBulkSaleGrades.length === 0 || cardBulkSaleGrades.includes(x.notes?.trim() || (displayLang === 'zh' ? '无' : '공란')))
                  );
                });
                const excludedDevices = availableHKDevices.filter(x => excludedDeviceIds.has(x.id));
                const soldDevices = availableHKDevices.filter(x => !excludedDeviceIds.has(x.id));

                const totalCostKRW = soldDevices.reduce((sum, d) => sum + (Number(d.purchase_cost) || 0), 0);
                const avgCostKRW = soldDevices.length > 0 ? totalCostKRW / soldDevices.length : 0;
                const unitPriceHKD = Number(cardBulkUnitPrice) || 0;
                const totalSellingPriceHKD = unitPriceHKD * soldDevices.length;
                const totalSellingPriceKRW = totalSellingPriceHKD * cnyRate;
                const totalMarginKRW = totalSellingPriceKRW - totalCostKRW;
                const avgMarginKRW = soldDevices.length > 0 ? totalMarginKRW / soldDevices.length : 0;

                const totalDeductionsHKD = Number(customDeductionAmountHkd) || 0;
                const totalDeductionsKRW = totalDeductionsHKD * cnyRate;
                const netMarginKRW = totalMarginKRW - totalDeductionsKRW;
                const avgNetMarginKRW = soldDevices.length > 0 ? netMarginKRW / soldDevices.length : 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', fontSize: '12px' }}>
                      <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>{displayLang === 'zh' ? '目标设备' : '대상 기기'}</span>
                        <strong style={{ fontSize: '14px', color: '#fff' }}>{availableHKDevices.length}대</strong>
                      </div>
                      <div style={{ padding: '8px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <span style={{ color: 'var(--success-color)', display: 'block', marginBottom: '2px' }}>{displayLang === 'zh' ? '确认销售' : '판매 완료 처리'}</span>
                        <strong style={{ fontSize: '14px', color: 'var(--success-color)' }}>{soldDevices.length}대</strong>
                      </div>
                      <div style={{ padding: '8px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                        <span style={{ color: 'var(--warning-color)', display: 'block', marginBottom: '2px' }}>{displayLang === 'zh' ? '排除(保留库存)' : '제외됨 (재고 유지)'}</span>
                        <strong style={{ fontSize: '14px', color: 'var(--warning-color)' }}>{excludedDevices.length}대</strong>
                      </div>
                    </div>

                    {/* 선택된 기기들의 평균 매입가 안내 카드 (항상 노출) */}
                    {soldDevices.length > 0 && (
                      <div style={{ 
                        padding: '10px 14px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px'
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {displayLang === 'zh' ? '所选设备的平均成本:' : '선택된 기기들의 평균 매입가:'}
                        </span>
                        <strong style={{ fontSize: '13px', color: 'var(--accent-light)' }}>
                          ₩{Math.round(avgCostKRW).toLocaleString()} 
                          <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                            (HK${Math.round(avgCostKRW / cnyRate).toLocaleString()})
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '6px' }}>
                            (총 ₩{totalCostKRW.toLocaleString()} (HK${Math.round(totalCostKRW / cnyRate).toLocaleString()}) / {soldDevices.length}대)
                          </span>
                        </strong>
                      </div>
                    )}

                    {/* 실시간 마진 계산 출력 */}
                    {unitPriceHKD > 0 && soldDevices.length > 0 && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span>{displayLang === 'zh' ? '总成本 (KRW):' : '총 원가 / 总成本 (KRW):'}</span>
                          <span style={{ color: '#fff', fontWeight: '500' }}>
                            ₩{totalCostKRW.toLocaleString()}
                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                              (HK${Math.round(totalCostKRW / cnyRate).toLocaleString()})
                            </span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span>{displayLang === 'zh' ? '总售价 (HKD):' : '총 판매가 / 总售价 (HKD):'}</span>
                          <span style={{ color: 'var(--accent-light)', fontWeight: 'bold' }}>
                            HK${totalSellingPriceHKD.toLocaleString()} 
                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                              (₩{Math.round(totalSellingPriceKRW).toLocaleString()})
                            </span>
                          </span>
                        </div>
                        {totalDeductionsHKD > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-color)' }}>
                            <span>{displayLang === 'zh' ? '总扣除 (HKD):' : '총 차감액 / 총 차감 (HKD):'}</span>
                            <span style={{ fontWeight: 'bold' }}>
                              -HK${totalDeductionsHKD.toLocaleString()}
                              <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                (-₩{Math.round(totalDeductionsKRW).toLocaleString()})
                              </span>
                            </span>
                          </div>
                        )}
                        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                        {totalDeductionsHKD > 0 ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#fff' }}>{displayLang === 'zh' ? '扣除后净利润:' : '차감 후 순마진 / 扣除后净利润:'}</span>
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: netMarginKRW >= 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                              }}>
                                {netMarginKRW >= 0 ? '+' : ''}₩{Math.round(netMarginKRW).toLocaleString()}
                                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                  (HK${Math.round(netMarginKRW / cnyRate).toLocaleString()})
                                </span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#fff' }}>{displayLang === 'zh' ? '单台平均净利润:' : '대당 평균 순마진 / 单台平均净利润:'}</span>
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: avgNetMarginKRW >= 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                              }}>
                                {avgNetMarginKRW >= 0 ? '+' : ''}₩{Math.round(avgNetMarginKRW).toLocaleString()}
                                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                  (HK${Math.round(avgNetMarginKRW / cnyRate).toLocaleString()})
                                </span>
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#fff' }}>{displayLang === 'zh' ? '预估总利润:' : '예상 총 마진 / 预估总利润:'}</span>
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: totalMarginKRW >= 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                              }}>
                                {totalMarginKRW >= 0 ? '+' : ''}₩{Math.round(totalMarginKRW).toLocaleString()}
                                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                  (HK${Math.round(totalMarginKRW / cnyRate).toLocaleString()})
                                </span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#fff' }}>{displayLang === 'zh' ? '单台平均利润:' : '대당 평균 마진 / 단태평균이윤:'}</span>
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: avgMarginKRW >= 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                              }}>
                                {avgMarginKRW >= 0 ? '+' : ''}₩{Math.round(avgMarginKRW).toLocaleString()}
                                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                  (HK${Math.round(avgMarginKRW / cnyRate).toLocaleString()})
                                </span>
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 차감 항목 적용 입력부 (수동 입력 방식) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  {displayLang === 'zh' ? '应用扣除项 / 차감 항목 적용 (수동 입력)' : '차감 항목 적용 (수동 입력):'}
                </span>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {displayLang === 'zh' ? '扣除原因 / 차감 사유' : '차감 사유 / 扣除原因'}
                    </label>
                    <input
                      type="text"
                      placeholder={displayLang === 'zh' ? '输入扣除原因 (例如: 屏幕划痕)' : '차감 사유를 입력하세요 (예: 액정 기스)'}
                      value={customDeductionName}
                      onChange={(e) => setCustomDeductionName(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {displayLang === 'zh' ? '扣除金额 / 차감 금액 (HKD)' : '차감 금액 / 扣除金额 (HKD)'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <input
                          type="number"
                          placeholder="0"
                          value={customDeductionAmountHkd}
                          onChange={(e) => setCustomDeductionAmountHkd(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff', flex: 1 }}
                        />
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>HK$</span>
                      </div>
                      {Number(customDeductionAmountHkd) > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '100px' }}>
                          ≒ ₩{Math.round(Number(customDeductionAmountHkd) * cnyRate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 제외된 기기 상세 리스트 및 제외 해제 */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '8px' }}>
                  제외된 기기 목록 / 已排除의设备 列表 ({(() => {
                    const targetModelNames = new Set<string>();
                    if (cardBulkSaleModel) {
                      targetModelNames.add(cardBulkSaleModel.trim().toUpperCase());
                      for (const [modelCode, petInfo] of petNameMap.entries()) {
                        if (
                          petInfo.ko.trim() === cardBulkSaleModel.trim() ||
                          petInfo.zh.trim() === cardBulkSaleModel.trim()
                        ) {
                          targetModelNames.add(modelCode.toUpperCase());
                          if (modelCode.toUpperCase().startsWith('SM-')) {
                            targetModelNames.add(modelCode.toUpperCase().substring(3));
                          } else {
                            targetModelNames.add('SM-' + modelCode.toUpperCase());
                          }
                        }
                      }
                    }
                    const availableHKDevices = hongkongInventory.filter(x => {
                      const modelClean = (x.model_name || '').trim().toUpperCase();
                      const isModelMatch = targetModelNames.has(modelClean) || 
                        (modelClean.startsWith('SM-') && targetModelNames.has(modelClean.substring(3))) ||
                        (!modelClean.startsWith('SM-') && targetModelNames.has('SM-' + modelClean));
                      return (
                        isModelMatch && 
                        !x.is_sold &&
                        (!cardBulkSaleGrades || cardBulkSaleGrades.length === 0 || cardBulkSaleGrades.includes(x.notes?.trim() || (displayLang === 'zh' ? '无' : '공란')))
                      );
                    });
                    return availableHKDevices.filter(x => excludedDeviceIds.has(x.id)).length;
                  })()}대)
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
                    const targetModelNames = new Set<string>();
                    if (cardBulkSaleModel) {
                      targetModelNames.add(cardBulkSaleModel.trim().toUpperCase());
                      for (const [modelCode, petInfo] of petNameMap.entries()) {
                        if (
                          petInfo.ko.trim() === cardBulkSaleModel.trim() ||
                          petInfo.zh.trim() === cardBulkSaleModel.trim()
                        ) {
                          targetModelNames.add(modelCode.toUpperCase());
                          if (modelCode.toUpperCase().startsWith('SM-')) {
                            targetModelNames.add(modelCode.toUpperCase().substring(3));
                          } else {
                            targetModelNames.add('SM-' + modelCode.toUpperCase());
                          }
                        }
                      }
                    }
                    const availableHKDevices = hongkongInventory.filter(x => {
                      const modelClean = (x.model_name || '').trim().toUpperCase();
                      const isModelMatch = targetModelNames.has(modelClean) || 
                        (modelClean.startsWith('SM-') && targetModelNames.has(modelClean.substring(3))) ||
                        (!modelClean.startsWith('SM-') && targetModelNames.has('SM-' + modelClean));
                      return (
                        isModelMatch && 
                        !x.is_sold &&
                        (!cardBulkSaleGrades || cardBulkSaleGrades.length === 0 || cardBulkSaleGrades.includes(x.notes?.trim() || (displayLang === 'zh' ? '无' : '공란')))
                      );
                    });
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
              <button onClick={() => { setCardBulkSaleModel(null); setCardBulkSaleGrades(null); setCustomDeductionName(''); setCustomDeductionAmountHkd(''); }} className={styles.btnCancel}>취소</button>
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

      {/* 차감 항목 추가/수정 모달 제거 */}

      {/* 승인 대기 / 완료 판매 정보 수정 모달 */}
      {editSaleModalOpen && editSaleDevice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '450px', width: '90%', backgroundColor: '#1e293b', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                {displayLang === 'zh' ? '修改销售信息 (판매 정보 수정)' : '판매 정보 수정'}
              </h3>
                            <button onClick={() => { setEditSaleModalOpen(false); setEditSaleDevice(null); }} className={styles.btnCancel}>
                {displayLang === 'zh' ? '取消' : '취소'}
              </button>
              <button onClick={executeUpdateSaleInfo} className={styles.btnSave}>
                {displayLang === 'zh' ? '保存' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기기 개별 정보 수정 모달 */}
      {editDeviceOpen && editingDevice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                {displayLang === 'zh' ? '修改设备信息' : '기기 정보 수정'}
              </h3>
              <button
                onClick={() => { setEditDeviceOpen(false); setEditingDevice(null); }}
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateDevice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {displayLang === 'zh' ? '贴纸 (Sticker)' : '스티커'}
                </label>
                <input
                  type="text"
                  value={editingSticker}
                  onChange={(e) => setEditingSticker(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {displayLang === 'zh' ? '机型' : '모델명'} *
                </label>
                <input
                  type="text"
                  value={editingModelName}
                  onChange={(e) => setEditingModelName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {displayLang === 'zh' ? '容量' : '용량'}
                </label>
                <input
                  type="text"
                  value={editingStorage}
                  onChange={(e) => setEditingStorage(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none'
                  }}
                  placeholder="예: 256G, 512G"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {displayLang === 'zh' ? '颜色' : '색상'}
                </label>
                <input
                  type="text"
                  value={editingColor}
                  onChange={(e) => setEditingColor(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {displayLang === 'zh' ? '电池 efficiency (%)' : '배터리 효율 (%)'}
                </label>
                <input
                  type="text"
                  value={editingBattery}
                  onChange={(e) => setEditingBattery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {displayLang === 'zh' ? '入库原价 (₩)' : '입고 원가 (₩)'}
                </label>
                <input
                  type="number"
                  value={editingCost}
                  onChange={(e) => setEditingCost(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {displayLang === 'zh' ? '备注' : '비고'}
                </label>
                <input
                  type="text"
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    outline: 'none'
                  }}
                  placeholder="A, B, C, D, LCD 등 등급 정보"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setEditDeviceOpen(false); setEditingDevice(null); }}
                  className={styles.btnCancel}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {displayLang === 'zh' ? '取消' : '취소'}
                </button>
                <button
                  type="submit"
                  className={styles.btnSave}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  disabled={savingDevice}
                >
                  {savingDevice 
                    ? (displayLang === 'zh' ? '保存中...' : '저장 중...') 
                    : (displayLang === 'zh' ? '保存' : '저장')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 차감 내역 수정 모달 */}
      {editDeductionModalOpen && editDeductionItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '450px', width: '90%', backgroundColor: '#1e293b', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                {displayLang === 'zh' ? '修改扣除项 (차감 항목 수정)' : '차감 항목 수정'}
              </h3>
              <button onClick={() => { setEditDeductionModalOpen(false); setEditDeductionItem(null); }} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#fff' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>판매 내역 / 销售明细</span>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{editDeductionItem.sold_summary || '-'}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>차감 사유 (한국어) / 扣除原因 (韩语)</label>
                <input
                  type="text"
                  value={editDeductionNameKo}
                  onChange={(e) => setEditDeductionNameKo(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>차감 사유 (중국어) / 扣除原因 (中文)</label>
                <input
                  type="text"
                  value={editDeductionNameZh}
                  onChange={(e) => setEditDeductionNameZh(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>수량 / 数量</label>
                <input
                  type="number"
                  value={editDeductionQty}
                  onChange={(e) => setEditDeductionQty(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>차감 단가 / 扣除单价 (HKD)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={editDeductionAmountHkd}
                    onChange={(e) => setEditDeductionAmountHkd(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff', flex: 1 }}
                  />
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>HK$</span>
                </div>
              </div>

              {/* 실시간 총 차감 계산 안내 */}
              {Number(editDeductionQty) > 0 && Number(editDeductionAmountHkd) >= 0 && (
                <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>총 차감액 (HKD):</span>
                    <strong style={{ color: 'var(--danger-color)' }}>
                      -HK${(Number(editDeductionQty) * Number(editDeductionAmountHkd)).toLocaleString()}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>총 차감액 (원화 환산):</span>
                    <strong style={{ color: 'var(--danger-color)' }}>
                      -₩{Math.round(Number(editDeductionQty) * Number(editDeductionAmountHkd) * (editDeductionItem.exchange_rate || cnyRate)).toLocaleString()}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.btnGroup} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
              <button onClick={() => { setEditDeductionModalOpen(false); setEditDeductionItem(null); }} className={styles.btnCancel}>
                {displayLang === 'zh' ? '取消' : '취소'}
              </button>
              <button onClick={executeUpdateDeduction} className={styles.btnSave}>
                {displayLang === 'zh' ? '保存' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기종 카드 일괄 가격 수정 모달 */}
      {bulkEditModalOpen && bulkEditCard && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '450px', width: '90%', backgroundColor: '#1e293b', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 className={styles.modalTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                {displayLang === 'zh' ? '批量修改销售价格 (일괄 판매가 수정)' : '기종 일괄 판매가 수정'}
              </h3>
              <button onClick={() => { setBulkEditModalOpen(false); setBulkEditCard(null); }} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="닫기">
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#fff' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>정산 월 / 结算月份</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{bulkEditCard.month}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>모델명 / 机型</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{getModelDisplayName(bulkEditCard.modelName)}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>대상 기기 수량 / 设备数量</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-light)', marginTop: '2px' }}>{bulkEditCard.count}대 / 台</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>새로운 판매 단가 / 销售单价 (HKD)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={bulkEditPrice}
                    onChange={(e) => setBulkEditPrice(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff', flex: 1 }}
                  />
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>HK$</span>
                </div>
              </div>

              {/* 실시간 일괄 시뮬레이션 안내 */}
              {Number(bulkEditPrice) >= 0 && (
                <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>일괄 매출액 합계:</span>
                    <strong style={{ color: 'var(--accent-light)' }}>
                      ₩{Math.round(Number(bulkEditPrice) * bulkEditCard.count * cnyRate).toLocaleString()}
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '4px' }}>
                        (HK${(Number(bulkEditPrice) * bulkEditCard.count).toLocaleString()})
                      </span>
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>일괄 순마진 합계:</span>
                    <strong style={{ color: (Number(bulkEditPrice) * bulkEditCard.count * cnyRate - bulkEditCard.totalCost) >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                      ₩{Math.round(Number(bulkEditPrice) * bulkEditCard.count * cnyRate - bulkEditCard.totalCost).toLocaleString()}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.btnGroup} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
              <button onClick={() => { setBulkEditModalOpen(false); setBulkEditCard(null); }} className={styles.btnCancel}>
                {displayLang === 'zh' ? '取消' : '취소'}
              </button>
              <button onClick={executeBulkPriceUpdate} className={styles.btnSave}>
                {displayLang === 'zh' ? '保存' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
