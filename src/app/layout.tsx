import type { Metadata } from "next";
import {
  Geist_Mono,
  Noto_Sans_KR,
  Noto_Serif_KR,
} from "next/font/google";
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

const notoSerif = Noto_Serif_KR({
  variable: "--font-serif-kr",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DraftDeck",
    template: "%s | DraftDeck",
  },
  description:
    "기술 글의 초안 작성, 선택 기반 AI 보조, 자동 저장 흐름을 한 화면에서 이어가는 개인용 writing workspace.",
  applicationName: "DraftDeck",
  keywords: [
    "AI editor",
    "draft writing",
    "markdown editor",
    "기술 블로그",
    "초안 작성",
  ],
  openGraph: {
    title: "DraftDeck",
    description:
      "초안 작성부터 AI 다듬기, 미리보기까지 한 흐름으로 연결하는 개인용 writing workspace.",
    siteName: "DraftDeck",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DraftDeck",
    description:
      "기술 글 초안과 AI 편집 흐름을 한 화면에서 이어가는 개인용 writing workspace.",
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
        className={`${notoSans.variable} ${notoSerif.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
