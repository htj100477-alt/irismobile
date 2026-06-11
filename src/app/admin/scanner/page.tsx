'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Coins, Lock, CheckCircle2, AlertCircle, X, Camera, RefreshCw } from 'lucide-react';

// Web Audio API를 이용한 비프음 합성 헬퍼
const playBeep = (type: 'success' | 'warning' | 'submit') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      // 높은 솔 톤의 짧고 청량한 Beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'warning') {
      // 낮은 삐-삐 두번 울림
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'submit') {
      // 청량한 딩동댕 톤
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    console.error('Failed to synthesize beep:', e);
  }
};

export default function ScannerPage() {
  const router = useRouter();
  
  // 인증 및 로딩 상태
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passError, setPassError] = useState(false);
  const [loading, setLoading] = useState(true);

  // 재고 및 폼 상태
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [saleDate, setSaleDate] = useState('');

  // 스캔 상태
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scanStatus, setScanStatus] = useState({ text: '대기 중 / 待机', isError: false });

  // html5-qrcode 스캐너 레퍼런스
  const scannerRef = useRef<any>(null);

  // 1. 세션 인증 확인 및 오늘 날짜 설정
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSaleDate(today);

    const isAuth = sessionStorage.getItem('scanner_auth') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      fetchInventory();
    } else {
      setLoading(false);
    }
  }, []);

  // 2. 패스코드 검증 (`1129`)
  const handlePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '1129') {
      sessionStorage.setItem('scanner_auth', 'true');
      setIsAuthenticated(true);
      setPassError(false);
      fetchInventory();
    } else {
      setPassError(true);
      playBeep('warning');
      setPasscode('');
    }
  };

  // 3. 재고 가져오기
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hongkong-inventory');
      const data = await res.json();
      if (data.success) {
        setInventory(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 4. 스캐너 토글 작동
  useEffect(() => {
    if (!isAuthenticated || !isScanning) {
      cleanupScanner();
      return;
    }

    // html5-qrcode 동적 임포트 및 초기화
    let isMounted = true;
    import('html5-qrcode').then((module) => {
      if (!isMounted || !isScanning) return;
      
      const config = {
        fps: 10,
        qrbox: (width: number, height: number) => {
          const size = Math.min(width, height) * 0.7;
          return { width: size, height: size * 0.5 }; // 바코드용 넓은 직사각형
        },
        aspectRatio: 1.777778
      };

      const scanner = new module.Html5QrcodeScanner(
        'scanner-reader-container',
        config,
        false
      );

      scanner.render(handleScanSuccess, handleScanFailure);
      scannerRef.current = scanner;
    }).catch(err => {
      console.error('Failed to load html5-qrcode:', err);
    });

    return () => {
      isMounted = false;
      cleanupScanner();
    };
  }, [isScanning, isAuthenticated]);

  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.error('Failed to clear scanner:', e);
      }
      scannerRef.current = null;
    }
  };

  // 5. 스캔 성공 콜백
  const handleScanSuccess = (decodedText: string) => {
    const rawCode = decodedText.trim();
    if (!rawCode) return;

    if (!selectedModel) {
      setScanStatus({ text: '기종을 먼저 선택해주세요! / 请先선택机型', isError: true });
      playBeep('warning');
      return;
    }

    // 해당 기종의 전체 미판매 재고 필터링
    const availableForModel = inventory.filter(
      item => !item.is_sold && item.model_name === selectedModel
    );

    // 스캔한 코드가 해당 모델의 일련번호(Sticker) 또는 IMEI에 매칭되는지 확인
    const matchedDevice = availableForModel.find(
      item =>
        (item.sticker && item.sticker.toLowerCase().replace(/\s+/g, '') === rawCode.toLowerCase().replace(/\s+/g, '')) ||
        (item.imei && item.imei.toLowerCase().replace(/\s+/g, '') === rawCode.toLowerCase().replace(/\s+/g, ''))
    );

    if (!matchedDevice) {
      setScanStatus({ text: `[${rawCode}] 선택한 기종에 매칭되는 기기가 없습니다. / 找不到设备`, isError: true });
      playBeep('warning');
      return;
    }

    // 이미 목록에 추가된 스티커인지 검사
    const isAlreadyScanned = scannedItems.some(item => item.id === matchedDevice.id);
    if (isAlreadyScanned) {
      setScanStatus({ text: `[${matchedDevice.sticker || matchedDevice.imei}] 이미 제외 등록된 기기입니다. / 已排除`, isError: true });
      playBeep('warning');
      return;
    }

    // 등록 성공
    setScannedItems(prev => [...prev, matchedDevice]);
    setScanStatus({ text: `[${matchedDevice.sticker || 'IMEI:' + matchedDevice.imei}] 제외 등록 완료 / 排除成功`, isError: false });
    playBeep('success');
  };

  const handleScanFailure = (err: any) => {
    // 빈번한 스캔 에러는 로그로 무시 (카메라 프레임 내 바코드가 검출되지 않을 때 매 프레임 발생)
  };

  // 6. 일괄 판매 완료 처리 실행
  const handleExecuteSale = async () => {
    if (!sellerName.trim()) {
      alert('판매원 이름을 입력해주세요. / 请输入销售员姓名。');
      playBeep('warning');
      return;
    }
    if (!saleDate) {
      alert('판매 날짜를 선택해주세요. / 请选择销售日期。');
      playBeep('warning');
      return;
    }
    if (!selectedModel) {
      alert('기종을 선택해주세요. / 请选择기종。');
      playBeep('warning');
      return;
    }
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) <= 0) {
      alert('올바른 판매단가를 입력해주세요. / 请输入正确的销售单价。');
      playBeep('warning');
      return;
    }

    const availableForModel = inventory.filter(
      item => !item.is_sold && item.model_name === selectedModel
    );

    // 스캔된 제외 기기를 뺀 나머지가 실제 판매될 기기
    const scannedIds = scannedItems.map(x => x.id);
    const soldDevices = availableForModel.filter(item => !scannedIds.includes(item.id));
    const unsoldDevices = availableForModel.filter(item => scannedIds.includes(item.id));

    if (soldDevices.length === 0) {
      alert('판매 완료 처리할 기기가 없습니다. 모든 기기가 스캔 제외되었습니다.');
      playBeep('warning');
      return;
    }

    const confirmMsg = `기종 [ ${selectedModel} ] 총 ${availableForModel.length}대 중:\n` +
      `- 판매 완료 처리: ${soldDevices.length}대\n` +
      `- 판매 단가: ¥${Number(sellingPrice).toLocaleString()} (CNY)\n` +
      `- 미판매 제외(재고 보존): ${unsoldDevices.length}대\n\n` +
      `정말로 스캔 제외 기기들을 빼고 일괄 판매 처리를 실행하시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    try {
      const remainingIdentifiers = unsoldDevices.map(d => d.imei || d.sticker).filter(Boolean);
      const soldIds = soldDevices.map(d => d.id);

      const res = await fetch('/api/hongkong-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sell',
          saleDate,
          sellerName: sellerName.trim(),
          sellingPrice: Number(sellingPrice),
          modelPrices: { [selectedModel]: Number(sellingPrice) },
          soldIds,
          remainingIdentifiers
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playBeep('submit');
        alert(`성공적으로 일괄 판매가 완료되었습니다! (총 ${soldDevices.length}대 판매 완료)`);
        setScannedItems([]);
        setIsScanning(false);
        fetchInventory();
      } else {
        alert(data.error || '판매 처리 중 오류가 발생했습니다.');
        playBeep('warning');
      }
    } catch (e) {
      alert('서버 통신 실패');
      playBeep('warning');
    }
  };

  // 7. 사용 가능한 고유 모델 기종 추출
  const availableModels = Array.from(
    new Set(inventory.filter(item => !item.is_sold).map(item => item.model_name))
  ).sort() as string[];

  // 로딩 인디케이터
  if (loading && inventory.length === 0) {
    return (
      <div style={{ backgroundColor: '#090d16', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
        데이터 동기화 중 / 载入중...
      </div>
    );
  }

  // 8. 패스코드 화면 (1129)
  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: '#030712', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui' }}>
        <form onSubmit={handlePassSubmit} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '32px 24px', width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', marginBottom: '16px' }}>
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0' }}>재고 관리 스캐너 로그인</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>보안 패스코드를 입력하세요. / 请输入密码</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              type="password"
              placeholder="••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ backgroundColor: '#090d16', border: passError ? '1px solid #ef4444' : '1px solid #334155', borderRadius: '8px', padding: '14px', color: '#fff', fontSize: '20px', letterSpacing: '8px', textAlign: 'center', outline: 'none' }}
              required
              autoFocus
            />
            {passError && <span style={{ fontSize: '11px', color: '#ef4444', textAlign: 'center', display: 'block' }}>잘못된 비밀번호입니다. 다시 확인해 주세요.</span>}
          </div>

          <button
            type="submit"
            style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            스캐너 실행 / 启动
          </button>
        </form>
      </div>
    );
  }

  // 9. 메인 스캐너 대시보드 화면
  const availableCountForSelected = inventory.filter(
    item => !item.is_sold && item.model_name === selectedModel
  ).length;

  return (
    <div style={{ backgroundColor: '#090d16', color: '#fff', minHeight: '100vh', padding: '16px', fontFamily: 'system-ui' }}>
      
      {/* 상단 헤더 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} style={{ color: '#10b981' }} />
            홍콩 재고 스캔 판매 / 扫码판매
          </h1>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>스캔한 기기 제외하고 자동 일괄 판매 처리</span>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('scanner_auth');
            setIsAuthenticated(false);
            setPasscode('');
          }}
          style={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', padding: '6px 12px', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          잠금
        </button>
      </header>

      {/* 입력 양식 카드 */}
      <section style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 판매원명 & 날짜 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="sellerInput" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>판매원 이름 / 销售员 (필수)</label>
            <input
              id="sellerInput"
              type="text"
              placeholder="예: 홍길동"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              style={{ backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="dateInput" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>판매 날짜 / 销售日期 (필수)</label>
            <input
              id="dateInput"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              style={{ backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
              required
            />
          </div>
        </div>

        {/* 기종 선택 & 판매 단가 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="modelSelect" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>대상 기종 선택 / 机型선택 (필수)</label>
            <select
              id="modelSelect"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setScannedItems([]); // 기종 변경 시 제외 리스트 초기화
                setScanStatus({ text: '대기 중 / 待机', isError: false });
              }}
              style={{ backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
              required
            >
              <option value="">-- 기종 선택 / 选择机型 --</option>
              {availableModels.map(m => (
                <option key={m} value={m}>{m} ({inventory.filter(item => !item.is_sold && item.model_name === m).length}대 가용)</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="priceInput" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>판매 단가 (위안 ¥) / 售价 (필수)</label>
            <div style={{ position: 'relative' }}>
              <input
                id="priceInput"
                type="number"
                placeholder="예: 1000"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                style={{ backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', padding: '10px 24px 10px 10px', color: '#fff', fontSize: '13px', width: '100%', outline: 'none' }}
                required
              />
              <span style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>¥</span>
            </div>
          </div>
        </div>

        {selectedModel && (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#60a5fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>선택 기종 현재 가용 재고: <strong>{availableCountForSelected}</strong> 대</span>
            <span>제외(미판매) 스캔 건수: <strong style={{ color: '#f59e0b' }}>{scannedItems.length}</strong> 대</span>
          </div>
        )}
      </section>

      {/* 스캐너 카메라 뷰포트 영역 */}
      {selectedModel && (
        <section style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={15} style={{ color: '#10b981' }} />
              카메라 스캔 영역 / 扫码区域
            </span>
            <button
              onClick={() => setIsScanning(prev => !prev)}
              style={{
                backgroundColor: isScanning ? '#ef4444' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? '스캐너 끄기 / 关闭' : '스캐너 켜기 / 启动'}
            </button>
          </div>

          {isScanning ? (
            <div 
              id="scanner-reader-container" 
              style={{ 
                width: '100%', 
                maxWidth: '450px', 
                margin: '0 auto', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                border: '1px solid #334155',
                backgroundColor: '#000'
              }} 
            />
          ) : (
            <div style={{ width: '100%', height: '160px', borderRadius: '8px', border: '2px dashed #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
              <Smartphone size={24} style={{ marginBottom: '8px' }} />
              [스캐너 켜기] 버튼을 누르면 카메라가 활성화됩니다.
            </div>
          )}

          {/* 스캔 결과 로그 알림판 */}
          <div style={{
            marginTop: '12px',
            backgroundColor: scanStatus.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: scanStatus.isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '12px',
            color: scanStatus.isError ? '#f87171' : '#34d399',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {scanStatus.isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            {scanStatus.text}
          </div>
        </section>
      )}

      {/* 스캔 완료/제외된 내역 리스트 */}
      {selectedModel && (
        <section style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
              제외(미판매) 등록 리스트 / 排除 목록 ({scannedItems.length}대)
            </span>
            {scannedItems.length > 0 && (
              <button
                onClick={() => {
                  setScannedItems([]);
                  playBeep('success');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
              >
                전체 비우기
              </button>
            )}
          </div>

          <div style={{
            maxHeight: '180px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {scannedItems.map((item, idx) => (
              <div 
                key={item.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid #1e293b', 
                  borderRadius: '6px', 
                  padding: '8px 12px',
                  fontSize: '12px' 
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>#{idx + 1}</span>
                  <span>[제외] {item.color ? `${item.color} | ` : ''}Sticker: <strong>{item.sticker || '-'}</strong></span>
                </div>
                <button
                  onClick={() => {
                    setScannedItems(prev => prev.filter(x => x.id !== item.id));
                    playBeep('success');
                  }}
                  style={{ background: 'none', border: 'none', color: '#f87171', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  title="제외 해제"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {scannedItems.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                남은 기기들의 스티커 바코드를 스캔하여 등록해 주세요.
              </div>
            )}
          </div>

          {/* 최종 제출 처리 버튼 */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <button
              onClick={handleExecuteSale}
              disabled={!selectedModel || availableCountForSelected - scannedItems.length <= 0}
              style={{
                width: '100%',
                backgroundColor: (!selectedModel || availableCountForSelected - scannedItems.length <= 0) ? '#1e293b' : '#4f46e5',
                color: (!selectedModel || availableCountForSelected - scannedItems.length <= 0) ? '#64748b' : '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: (!selectedModel || availableCountForSelected - scannedItems.length <= 0) ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                transition: 'background 0.2s'
              }}
            >
              {selectedModel ? (
                `제외 기기 제외하고 ${availableCountForSelected - scannedItems.length}대 일괄 판매완료 실행`
              ) : (
                '기종을 먼저 선택하세요'
              )}
            </button>
            {selectedModel && availableCountForSelected - scannedItems.length > 0 && (
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#10b981', marginTop: '8px', margin: 0 }}>
                * 스캔한 {scannedItems.length}대를 제외한 <strong>{availableCountForSelected - scannedItems.length}대</strong>가 ¥{Number(sellingPrice || 0).toLocaleString()} 위안에 일괄 판매완료 처리됩니다.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
