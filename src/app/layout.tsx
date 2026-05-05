import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  variable: "--font-sans-kr",
  weight: ["400", "500", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DraftDeck",
    template: "%s | DraftDeck",
  },
  description:
    "자료 가져오기, 선택 기반 AI 리라이트, 버전 기록, 마크다운 내보내기를 한 화면 흐름으로 잇는 기술 글 초안 도구입니다.",
  applicationName: "DraftDeck",
  keywords: [
    "technical writing workflow",
    "ai drafting workspace",
    "markdown editor",
    "revision history",
    "기술 글 초안",
    "초안 작성",
  ],
  openGraph: {
    title: "DraftDeck",
    description:
      "기술 글 초안 작성, 선택 기반 AI 다듬기, 버전 기록, 마크다운 내보내기를 한 흐름으로 연결합니다.",
    siteName: "DraftDeck",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DraftDeck",
    description:
      "기술 글 초안 작성과 AI 다듬기를 연결하는 글쓰기 도구.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
