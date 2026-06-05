'use client';

import { useEffect } from 'react';

export default function InAppBrowserEscaper() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    const currentUrl = window.location.href;

    // 카카오톡, 라인 등 모바일 메신저 인앱 브라우저 여부 감시
    const isKakaoTalk = ua.indexOf('kakaotalk') !== -1;
    const isLine = ua.indexOf('line') !== -1;
    const isFacebook = ua.indexOf('fb_iab') !== -1 || ua.indexOf('fbav') !== -1;
    const isInstagram = ua.indexOf('instagram') !== -1;

    const isInApp = isKakaoTalk || isLine || isFacebook || isInstagram;

    if (isInApp) {
      // 1. 안드로이드 (크롬으로 강제 탈출)
      if (ua.indexOf('android') !== -1) {
        const cleanUrl = currentUrl.replace(/https?:\/\//i, '');
        window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      } 
      // 2. iOS 아이폰/아이패드 (사파리로 강제 탈출)
      else if (ua.indexOf('iphone') !== -1 || ua.indexOf('ipad') !== -1) {
        if (isKakaoTalk) {
          // 카카오톡은 인앱 브라우저 아웃용 전용 스킴 지원
          window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
        } else {
          // 타 메신저(인스타/페이스북)의 경우 iOS는 보안 정책상 타 브라우저 강제 이동을 제한함
          // 이 경우 사용자 액션(탭)을 유도하기 위해 알림이나 가이드를 띄우는 것이 좋습니다.
        }
      }
    }
  }, []);

  return null;
}
