import type { Metadata } from "next";
import { Inter, Noto_Sans_SC, Geist, Manrope, EB_Garamond, Sora, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
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

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-eb-garamond",
  weight: ["400", "500", "600", "700", "800"],
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
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
    <html lang="zh-CN" data-theme="sahara" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansSC.variable} ${geist.variable} ${manrope.variable} ${ebGaramond.variable} ${sora.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}>
        <ThemeProvider>
          <AppProvider>
            <ConfirmDialogProvider>
              {children}
            </ConfirmDialogProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
