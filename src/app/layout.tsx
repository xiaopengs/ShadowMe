import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-sc",
});

export const metadata: Metadata = {
  title: "ShadowMe | 影子分身协作看板",
  description: "智能影子分身协作系统 - 当主角不在时，影子替他战斗",
  keywords: ["影子分身", "协作看板", "Claude Code", "GitLab", "AI助手"],
  authors: [{ name: "ShadowMe Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className="antialiased min-h-screen">
        <AppProvider>
          <ConfirmDialogProvider>
            {children}
          </ConfirmDialogProvider>
        </AppProvider>
      </body>
    </html>
  );
}
