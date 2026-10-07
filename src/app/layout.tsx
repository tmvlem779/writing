import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { BrandLogo } from "@/components/brand-logo";
import { PasswordSetupSessionRedirect } from "@/components/password-setup-session-redirect";
import "./globals.css";

const bodyFont = Noto_Sans_KR({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "문득문득 | 문장 구조와 확장",
  description: "고등학생을 위한 문장 구조와 확장 AI 글쓰기 도우미"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" className={bodyFont.variable}>
      <body>
        <PasswordSetupSessionRedirect />
        <header className="site-header">
          <BrandLogo className="brand" />
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>문득문득은 학생 대신 글을 쓰지 않고, 스스로 문장을 탐구하도록 돕습니다.</p>
          <p>AI 응답은 틀릴 수 있습니다. 중요한 판단은 교사와 함께 확인하세요.</p>
        </footer>
      </body>
    </html>
  );
}
