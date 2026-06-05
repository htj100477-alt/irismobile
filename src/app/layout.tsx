import type { Metadata } from "next";
import "@/styles/globals.css";
import InAppBrowserEscaper from "@/components/InAppBrowserEscaper";

export const metadata: Metadata = {
  title: "트루 모바일 - 모바일 특화 중고폰 매입 & 판매",
  description: "내 폰 시세조회부터 즉시 판매, 안심 중고폰 구매까지 모바일에서 간편하게 완료하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <InAppBrowserEscaper />
        {children}
      </body>
    </html>
  );
}
