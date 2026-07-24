import type { Metadata } from "next";
import "./globals.css";
import "./cafe-extra.css";

export const metadata: Metadata = {
  title: "Crimson Café｜绯色咖啡馆",
  description: "点一杯咖啡，看一段只属于你们的故事。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="theme-color" content="#f4eadf" />
      </head>
      <body>{children}</body>
    </html>
  );
}
