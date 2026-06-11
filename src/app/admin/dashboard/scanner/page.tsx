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

  // 카메라 장치 목록 및 활성 선택 인덱스 상태 추가
  const [cameraDevices, setCameraDevices] = useState<any[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  // html5-qrcode 인스턴스 래퍼
  const html5QrCodeRef = useRef<any>(null);

  // 동일 바코드 연속 스캔 방지용 쿨다운 레프
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  // 리액트 클로저 문제(Stale Closure) 해결용 실시간 레프 참조
  const scannedItemsRef = useRef<any[]>([]);
  const inventoryRef = useRef<any[]>([]);

  useEffect(() => {
    scannedItemsRef.current = scannedItems;
  }, [scannedItems]);

  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  // 카메라 장치 목록 불러오기 함수
  const loadCameraDevices = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameraDevices(devices);
        
        // 기본으로 후면 카메라를 검색하여 초기 설정
        const backIdx = devices.findIndex(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('후면') ||
          d.label.toLowerCase().includes('environment') ||
          d.label.toLowerCase().includes('camera 0')
        );
        if (backIdx !== -1) {
          setActiveCameraIndex(backIdx);
        } else {
          setActiveCameraIndex(0);
        }
      }
    } catch (e) {
      console.warn('Failed to query camera devices:', e);
    }
  };

  // 1. 세션 인증 확인 및 오늘 날짜 설정
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSaleDate(today);

    const isAuth = sessionStorage.getItem('scanner_auth') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      fetchInventory();
      loadCameraDevices();
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
      loadCameraDevices();
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

  // 3.1. 사진 파일 바코드 분석 실행
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedModel) {
      alert('기종을 먼저 선택해주세요. / 请先选择机型。');
      playBeep('warning');
      return;
    }

    setScanStatus({ text: '사진 분석 중... / 正在分析图片...', isError: false });
    
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // 실시간 카메라 스캐너가 실행 중이라면 정지
      if (isScanning) {
        await stopScanner();
      }

      // 깨끗한 새 인스턴스로 파일 스캔 실행
      const scanner = new Html5Qrcode('scanner-reader-container');
      const decodedText = await scanner.scanFile(file, false);
      
      const wasAdded = handleScanSuccess(decodedText);
      if (wasAdded) {
        setScanStatus({ text: `[${decodedText}] 스캔 성공 및 제외 등록 완료!`, isError: false });
      }
    } catch (err: any) {
      console.error(err);
      setScanStatus({ text: `사진에서 바코드를 인식하지 못했습니다. 더 선명하고 밝게 촬영해 보세요.`, isError: true });
      playBeep('warning');
    } finally {
      // 파일 입력 인풋 값 리셋
      e.target.value = '';
    }
  };

  // 3.2. 실시간 비디오 프레임 스냅샷을 캡처하여 즉시 해독 시도
  const captureSnapshotAndScan = async () => {
    if (!isScanning) return;
    
    const video = document.querySelector('#scanner-reader-container video') as HTMLVideoElement;
    if (!video) return;

    setScanStatus({ text: '스냅샷 분석 중... / 正在分析快照...', isError: false });

    // 화면 플래시 피드백 효과
    const container = document.getElementById('scanner-reader-container');
    if (container) {
      container.style.opacity = '0.3';
      setTimeout(() => {
        container.style.opacity = '1.0';
      }, 80);
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 비디오의 현재 프레임을 캔버스에 그리기
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 캔버스를 블롭 파일로 변환하여 분석 시작
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setScanStatus({ text: '스냅샷 생성 실패', isError: true });
          return;
        }
        
        const file = new File([blob], "snapshot.png", { type: "image/png" });
        
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          
          // 실시간 스캐너와 엉키지 않도록 별개의 임시 엘리먼트로 스캔 실행
          const tempDiv = document.createElement('div');
          tempDiv.id = 'temp-scanner-container-snapshot';
          tempDiv.style.display = 'none';
          document.body.appendChild(tempDiv);
          
          const tempScanner = new Html5Qrcode('temp-scanner-container-snapshot');
          const decodedText = await tempScanner.scanFile(file, false);
          
          // 임시 엘리먼트 소멸
          document.body.removeChild(tempDiv);
          
          const wasAdded = handleScanSuccess(decodedText);
          if (wasAdded) {
            setScanStatus({ text: `[${decodedText}] 터치 스냅샷 분석 성공! 제외 완료.`, isError: false });
          }
        } catch (scanErr) {
          console.warn(scanErr);
          setScanStatus({ 
            text: '스냅샷 인식 실패: 이미지 화질이 흐립니다. 조금 더 멀리서 초점을 맞춰보세요.', 
            isError: true 
          });
          playBeep('warning');
        }
      }, 'image/png');
    } catch (e: any) {
      console.error(e);
      setScanStatus({ text: `스냅샷 분석 실패: ${e.message || String(e)}`, isError: true });
      playBeep('warning');
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

  // 깨끗한 새 스캐너 인스턴스를 생성하고 구동하는 최상위 헬퍼 함수
  const runStart = async (cameraConstraints: any) => {
    const { Html5Qrcode } = await import('html5-qrcode');
    
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {}
      html5QrCodeRef.current = null;
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
      const now = Date.now();
      const code = decodedText.trim();
      
      // 2초 내 동일 바코드 스캔 시 쿨다운 처리 (중복 비프/에러 비프 스패밍 방지)
      if (code === lastScannedCodeRef.current && (now - lastScanTimeRef.current) < 2000) {
        return;
      }
      
      lastScannedCodeRef.current = code;
      lastScanTimeRef.current = now;

      // 스캔 처리 (카메라를 끄지 않고 연속 실행 상태를 유지)
      handleScanSuccess(code);
    };

    await scanner.start(
      cameraConstraints,
      qrConfig,
      successCallback,
      () => {}
    );
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScanStatus({ text: '스캐너 구동 중...', isError: false });

    // React 렌더링 후 DOM 마운트 대기
    setTimeout(async () => {
      try {
        // 선택된 카메라 디바이스 ID 확인
        let selectedCameraId = "";
        if (cameraDevices.length > 0) {
          selectedCameraId = cameraDevices[activeCameraIndex]?.id || cameraDevices[0].id;
        }

        try {
          // 1차 시도: 선택된 카메라 기기 ID를 지정하여 고화질 1080p 설정으로 시작
          if (selectedCameraId) {
            await runStart({
              deviceId: { exact: selectedCameraId },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            });
          } else {
            // 카메라 목록이 없다면 facingMode 환경 설정 시도
            throw new Error('No camera list parsed yet');
          }
        } catch (err1) {
          console.warn('High resolution starting failed on this camera, retrying standard resolution...', err1);
          // 2차 시도: 일반 해상도로 기기 직접 타겟팅 구동
          if (selectedCameraId) {
            await runStart(selectedCameraId);
          } else {
            await runStart({ facingMode: 'environment' });
          }
        }

        setScanStatus({ text: '바코드/QR을 빨간 가이드 박스 안에 맞춰주세요.', isError: false });
      } catch (err: any) {
        console.error(err);
        const errMsg = err.message || err.name || String(err);
        setScanStatus({ text: `카메라 실행 실패: ${errMsg}`, isError: true });
        setIsScanning(false);
        playBeep('warning');
      }
    }, 150);
  };

  // 다중 카메라를 순회 전환하는 기능
  const handleSwitchCamera = async () => {
    if (cameraDevices.length <= 1) {
      alert('전환 가능한 다른 카메라 하드웨어가 없습니다. / 只有一个摄像头。');
      return;
    }
    
    const nextIndex = (activeCameraIndex + 1) % cameraDevices.length;
    setActiveCameraIndex(nextIndex);
    
    if (isScanning) {
      setScanStatus({ text: `카메라 전환 중... (${nextIndex + 1}/${cameraDevices.length})`, isError: false });
      try {
        const nextDeviceId = cameraDevices[nextIndex].id;
        // 새로운 카메라 구동 시도
        try {
          await runStart({
            deviceId: { exact: nextDeviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          });
        } catch (switchErr) {
          // 고화질 실패 시 일반 해상도
          await runStart(nextDeviceId);
        }
        setScanStatus({ text: `카메라 전환 완료! (${cameraDevices[nextIndex].label || '카메라 ' + (nextIndex + 1)})`, isError: false });
      } catch (err: any) {
        console.error(err);
        const errMsg = err.message || err.name || String(err);
        setScanStatus({ text: `카메라 전환 실패: ${errMsg}`, isError: true });
        playBeep('warning');
      }
    }
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

    const availableForModel = inventoryRef.current.filter(
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

    const isAlreadyScanned = scannedItemsRef.current.some(item => item.id === matchedDevice.id);
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Camera size={15} style={{ color: '#10b981' }} />
              스캔 카메라 / 扫码镜头 (바코드 라인 조준)
            </span>
            
            {/* 스캔 모드 선택 버튼 그룹 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={toggleScanner}
                  style={{
                    flex: 1,
                    backgroundColor: isScanning ? '#ef4444' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
                  {isScanning ? '실시간 스캔 중단' : '카메라 실시간 스캔'}
                </button>

                <label
                  style={{
                    flex: 1,
                    backgroundColor: '#4f46e5',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '10px 8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textAlign: 'center'
                  }}
                >
                  <Camera size={12} />
                  사진촬영/갤러리 선택
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileScan}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {cameraDevices.length > 1 && (
                <button
                  onClick={handleSwitchCamera}
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    borderRadius: '6px',
                    padding: '10px 8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={12} />
                  다른 카메라로 전환 / 切换摄像头 ({activeCameraIndex + 1}/{cameraDevices.length})
                </button>
              )}
            </div>
          </div>

          {/* 카메라 비디오 캔버스 컨테이너 (scanFile 분석을 위해 항상 DOM에 유지하되 숨김/노출 처리) */}
          <div style={{ position: 'relative', display: isScanning ? 'block' : 'none' }}>
            <div 
              id="scanner-reader-container" 
              onClick={captureSnapshotAndScan}
              style={{ 
                width: '100%', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                border: '1px solid #334155',
                backgroundColor: '#000',
                aspectRatio: '1.33',
                cursor: 'pointer',
                transition: 'opacity 0.08s ease'
              }} 
            />
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(3, 7, 18, 0.75)',
              color: '#34d399',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '6px 12px',
              borderRadius: '20px',
              pointerEvents: 'none',
              zIndex: 30,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              📸 화면 터치 시 즉시 현재 화면 분석
            </div>
          </div>

          {!isScanning && (
            <div style={{ width: '100%', height: '140px', borderRadius: '8px', border: '2px dashed #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '10px' }}>
              <Smartphone size={24} style={{ marginBottom: '8px', color: '#4b5563' }} />
              <span>[실시간 스캔]을 눌러 바코드를 실시간 조준하거나,</span>
              <span style={{ marginTop: '2px' }}>[사진촬영/갤러리 선택]으로 직접 촬영하여 인식시키세요.</span>
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
                <span>#{idx + 1} | Sticker: <strong>{item.sticker || (item.imei?.startsWith('NO_IMEI-') ? 'IMEI 없음' : 'IMEI:' + item.imei)}</strong></span>
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
