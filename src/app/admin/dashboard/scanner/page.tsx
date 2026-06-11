'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Lock, CheckCircle2, AlertCircle, X, Camera, RefreshCw } from 'lucide-react';

// Web Audio API를 이용한 비프음 합성 헬퍼
const playBeep = (type: 'success' | 'warning' | 'submit') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'submit') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    console.error('Failed to play sound:', e);
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
  const [saleDate, setSaleDate] = useState('');
  
  // 판매원 이름은 '레이'로 고정
  const sellerName = '레이';

  // 스캔 상태
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scanStatus, setScanStatus] = useState({ text: '대기 중 / 待机', isError: false });

  // html5-qrcode 인스턴스 래퍼
  const html5QrCodeRef = useRef<any>(null);

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

  // 4. 스캐너 켜기/끄기 기능 (Html5Qrcode 직접 제어)
  const toggleScanner = async () => {
    if (!selectedModel) {
      alert('기종을 먼저 선택해주세요. / 请先选择机型。');
      playBeep('warning');
      return;
    }

    if (isScanning) {
      await stopScanner();
    } else {
      await startScanner();
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScanStatus({ text: '스캐너 구동 중...', isError: false });

    // React 렌더링 후 DOM 마운트 대기
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch (e) {}
        }

        const scanner = new Html5Qrcode('scanner-reader-container');
        html5QrCodeRef.current = scanner;

        const qrConfig = {
          fps: 15,
          qrbox: (width: number, height: number) => {
            const size = Math.min(width, height);
            return { width: Math.round(size * 0.85), height: Math.round(size * 0.45) };
          }
        };

        const successCallback = async (decodedText: string) => {
          const wasAdded = handleScanSuccess(decodedText);
          if (wasAdded) {
            try {
              await scanner.stop();
              setIsScanning(false);
            } catch (err) {
              console.error('Failed to stop camera:', err);
            }
          }
        };

        try {
          // 1차 시도: 1080p 고화질 설정 (이상적인 높이/너비로 제한은 완화)
          await scanner.start(
            { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            qrConfig,
            successCallback,
            () => {}
          );
        } catch (firstErr) {
          console.warn('High resolution initialization failed, retrying with default environment camera...', firstErr);
          // 2차 시도: 기본 후면 카메라 모드
          await scanner.start(
            { facingMode: 'environment' },
            qrConfig,
            successCallback,
            () => {}
          );
        }

        setScanStatus({ text: '바코드/QR을 빨간 가이드 박스 안에 맞춰주세요.', isError: false });
      } catch (err: any) {
        console.error(err);
        setScanStatus({ text: `카메라 실행 실패: ${err.message || '권한을 승인해주세요'}`, isError: true });
        setIsScanning(false);
        playBeep('warning');
      }
    }, 150);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
    setScanStatus({ text: '대기 중 / 待机', isError: false });
  };

  // 5. 스캔 데이터 처리
  const handleScanSuccess = (decodedText: string): boolean => {
    const rawCode = decodedText.trim();
    if (!rawCode) return false;

    const availableForModel = inventory.filter(
      item => !item.is_sold && item.model_name === selectedModel
    );

    // IMEI 또는 Sticker 일치 확인
    const matchedDevice = availableForModel.find(
      item =>
        (item.sticker && item.sticker.toLowerCase().replace(/\s+/g, '') === rawCode.toLowerCase().replace(/\s+/g, '')) ||
        (item.imei && item.imei.toLowerCase().replace(/\s+/g, '') === rawCode.toLowerCase().replace(/\s+/g, ''))
    );

    if (!matchedDevice) {
      setScanStatus({ text: `[${rawCode}] 해당 기종에 일치하는 재고가 없습니다.`, isError: true });
      playBeep('warning');
      return false;
    }

    const isAlreadyScanned = scannedItems.some(item => item.id === matchedDevice.id);
    if (isAlreadyScanned) {
      setScanStatus({ text: `[${matchedDevice.sticker || matchedDevice.imei}] 이미 제외 등록된 단말기입니다.`, isError: true });
      playBeep('warning');
      return false;
    }

    // 성공 등록
    setScannedItems(prev => [...prev, matchedDevice]);
    setScanStatus({ text: `[${matchedDevice.sticker || matchedDevice.imei}] 미판매 제외 추가 완료!`, isError: false });
    playBeep('success');
    return true;
  };

  // 6. 일괄 판매 전송 처리
  const handleExecuteSale = async () => {
    if (!saleDate) {
      alert('판매 날짜를 선택해주세요.');
      playBeep('warning');
      return;
    }
    if (!selectedModel) {
      alert('대상 기종을 선택해주세요.');
      playBeep('warning');
      return;
    }
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) <= 0) {
      alert('올바른 위안화(CNY) 판매가격을 입력해주세요.');
      playBeep('warning');
      return;
    }

    const availableForModel = inventory.filter(
      item => !item.is_sold && item.model_name === selectedModel
    );

    const scannedIds = scannedItems.map(x => x.id);
    const soldDevices = availableForModel.filter(item => !scannedIds.includes(item.id));
    const unsoldDevices = availableForModel.filter(item => scannedIds.includes(item.id));

    if (soldDevices.length === 0) {
      alert('판매 완료 처리할 기기가 없습니다. 모든 가용 기기가 미판매로 스캔 제외되었습니다.');
      playBeep('warning');
      return;
    }

    const confirmMsg = `기종 [ ${selectedModel} ] 총 ${availableForModel.length}대 중:\n` +
      `- 판매 완료 처리: ${soldDevices.length}대\n` +
      `- 판매 단가: ¥${Number(sellingPrice).toLocaleString()} (CNY)\n` +
      `- 미판매 제외(재고 보존): ${unsoldDevices.length}대\n\n` +
      `정말로 제외된 기기들을 빼고 일괄 판매완료를 실행하시겠습니까?`;

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
          sellerName, // '레이'로 전송
          sellingPrice: Number(sellingPrice),
          modelPrices: { [selectedModel]: Number(sellingPrice) },
          soldIds,
          remainingIdentifiers
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playBeep('submit');
        alert(`성공적으로 일괄 판매 완료 처리가 완료되었습니다!\n(판매완료: ${soldDevices.length}대 / 재고보존: ${unsoldDevices.length}대)`);
        setScannedItems([]);
        setIsScanning(false);
        fetchInventory();
      } else {
        alert(data.error || '판매 완료 저장 실패');
        playBeep('warning');
      }
    } catch (e) {
      alert('네트워크 오류');
      playBeep('warning');
    }
  };

  const availableModels = Array.from(
    new Set(inventory.filter(item => !item.is_sold).map(item => item.model_name))
  ).sort() as string[];

  const availableCountForSelected = inventory.filter(
    item => !item.is_sold && item.model_name === selectedModel
  ).length;

  if (loading && inventory.length === 0) {
    return (
      <div style={{ backgroundColor: '#090d16', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
        데이터 동기화 중 / Loading...
      </div>
    );
  }

  // 패스코드 로그인 화면
  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: '#030712', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui' }}>
        <form onSubmit={handlePassSubmit} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '32px 24px', width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', marginBottom: '16px' }}>
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0' }}>재고 관리 스캐너 로그인</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>패스코드를 입력하세요. / 请输入密码</p>
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
            {passError && <span style={{ fontSize: '11px', color: '#ef4444', textAlign: 'center', display: 'block' }}>잘못된 비밀번호입니다.</span>}
          </div>

          <button
            type="submit"
            style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
          >
            스캐너 실행 / 启动
          </button>
        </form>
      </div>
    );
  }

  // 메인 스캐너 화면
  return (
    <div style={{ backgroundColor: '#090d16', color: '#fff', minHeight: '100vh', padding: '16px', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. 상단 타이틀 바 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
            홍콩 재고 스캔 판매 / 扫码판매
          </h1>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>남은 기기 바코드 스캔 후 일괄 판매완료 처리 (판매원: 레이)</p>
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

      {/* 2. 입력 양식 카드 - 모바일 가독성을 위해 완전히 수직 정렬로 레이아웃 배치 */}
      <section style={{ 
        backgroundColor: '#0f172a', 
        border: '1px solid #1e293b', 
        borderRadius: '10px', 
        padding: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px' 
      }}>

        {/* 판매 일자 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="dateInput" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>판매 날짜 / 销售日期 (필수)</label>
          <input
            id="dateInput"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            style={{ backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none' }}
            required
          />
        </div>

        {/* 대상 기종 선택 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="modelSelect" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>대상 기종 선택 / 机型选择 (필수)</label>
          <select
            id="modelSelect"
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              setScannedItems([]); // 기종이 바뀔 경우 이전 스캔내역 초기화
              setScanStatus({ text: '대기 중 / 待机', isError: false });
            }}
            style={{ backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none' }}
            required
          >
            <option value="">-- 기종 선택 / 选择机型 --</option>
            {availableModels.map(m => (
              <option key={m} value={m}>{m} ({inventory.filter(item => !item.is_sold && item.model_name === m).length}대 가용)</option>
            ))}
          </select>
        </div>

        {/* 판매 단가 (위안화) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="priceInput" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>판매 단가 (위안 ¥) / 售价 (필수)</label>
          <div style={{ position: 'relative' }}>
            <input
              id="priceInput"
              type="number"
              placeholder="예: 1000"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              style={{ backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '6px', padding: '12px 28px 12px 12px', color: '#fff', fontSize: '14px', width: '100%', outline: 'none' }}
              required
            />
            <span style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>¥</span>
          </div>
        </div>

        {/* 기종 선택시 요약 현황 정보 */}
        {selectedModel && (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#60a5fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>현재 총 재고: <strong>{availableCountForSelected}</strong> 대</span>
            <span>스캔 제외(미판매): <strong style={{ color: '#f59e0b' }}>{scannedItems.length}</strong> 대</span>
          </div>
        )}
      </section>

      {/* 3. 카메라 스캐너 영역 */}
      {selectedModel && (
        <section style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={15} style={{ color: '#10b981' }} />
              스캔 카메라 렌즈 / 扫码镜头
            </span>
            <button
              onClick={toggleScanner}
              style={{
                backgroundColor: isScanning ? '#ef4444' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? '스캔 중단 / 关闭' : '스캔 시작 / 启动'}
            </button>
          </div>

          {/* 카메라 비디오 캔버스 컨테이너 */}
          {isScanning ? (
            <div 
              id="scanner-reader-container" 
              style={{ 
                width: '100%', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                border: '1px solid #334155',
                backgroundColor: '#000',
                aspectRatio: '1.33'
              }} 
            />
          ) : (
            <div style={{ width: '100%', height: '140px', borderRadius: '8px', border: '2px dashed #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '10px' }}>
              <Smartphone size={24} style={{ marginBottom: '8px', color: '#4b5563' }} />
              <span>[스캔 시작]을 누르면 카메라 렌즈가 활성화되며,</span>
              <span style={{ marginTop: '2px' }}>스티커 인식 시 스캐너가 자동 종료됩니다.</span>
            </div>
          )}

          {/* 스캔 결과 피드백 알림창 */}
          <div style={{
            backgroundColor: scanStatus.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: scanStatus.isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '12px',
            color: scanStatus.isError ? '#f87171' : '#34d399',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {scanStatus.isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span style={{ wordBreak: 'break-all' }}>{scanStatus.text}</span>
          </div>

          {scanStatus.isError && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '11px',
              color: '#f87171',
              lineHeight: '1.4',
              textAlign: 'left'
            }}>
              <strong>💡 카메라 권한 승인 안내:</strong> 브라우저 주소창 왼쪽의 자물쇠(설정) 아이콘을 터치하여 <strong>카메라 권한을 '허용'</strong>으로 수동 승인해주시기 바랍니다.
            </div>
          )}
        </section>
      )}

      {/* 4. 스캔 제외 목록 및 판매 실행 */}
      {selectedModel && (
        <section style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
              제외 등록 리스트 (재고 보존) ({scannedItems.length}대)
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
            maxHeight: '160px',
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
                <span>#{idx + 1} | Sticker: <strong>{item.sticker || 'IMEI:' + item.imei}</strong></span>
                <button
                  onClick={() => {
                    setScannedItems(prev => prev.filter(x => x.id !== item.id));
                    playBeep('success');
                  }}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {scannedItems.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                제외할(판매 안 된) 기기의 스티커를 스캔해주세요.
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '14px', marginTop: '6px' }}>
            <button
              onClick={handleExecuteSale}
              disabled={availableCountForSelected - scannedItems.length <= 0}
              style={{
                width: '100%',
                backgroundColor: (availableCountForSelected - scannedItems.length <= 0) ? '#1e293b' : '#4f46e5',
                color: (availableCountForSelected - scannedItems.length <= 0) ? '#64748b' : '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: (availableCountForSelected - scannedItems.length <= 0) ? 'not-allowed' : 'pointer'
              }}
            >
              제외 기기 빼고 {availableCountForSelected - scannedItems.length}대 일괄 판매 처리
            </button>
            {availableCountForSelected - scannedItems.length > 0 && (
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#10b981', marginTop: '8px', margin: 0 }}>
                * 스캔 완료한 {scannedItems.length}대를 제외한 <strong>{availableCountForSelected - scannedItems.length}대</strong>가 기당 ¥{Number(sellingPrice || 0).toLocaleString()} 위안에 판매 완료 처리됩니다.
              </p>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
