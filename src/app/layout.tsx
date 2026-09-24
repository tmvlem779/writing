import type { Metadata } from "next";
import Link from "next/link";
import { InviteSessionRedirect } from "@/components/invite-session-redirect";
import "./globals.css";

export const metadata: Metadata = {
  title: "문장나래 | 문장 구조와 확장",
  description: "고등학생을 위한 문장 구조와 확장 AI 글쓰기 도우미"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <InviteSessionRedirect />
        <header className="site-header">
          <Link className="brand" href="/" aria-label="문장나래 홈">
            <span className="brand-mark">문</span>
            <span>문장나래</span>
          </Link>
          <nav aria-label="주요 메뉴">
            <Link href="/learn">학습하기</Link>
            <Link href={{ pathname: "/history" }}>나의 기록</Link>
            <Link href="/teacher">교사 화면</Link>
            <Link href="/privacy">개인정보 안내</Link>
            <Link className="nav-button" href="/login">로그인</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>문장나래는 학생 대신 글을 쓰지 않고, 스스로 문장을 탐구하도록 돕습니다.</p>
          <p>AI 응답은 틀릴 수 있습니다. 중요한 판단은 교사와 함께 확인하세요.</p>
        </footer>
      </body>
    </html>
  );
}
