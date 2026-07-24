import type { Metadata } from "next";
import "./globals.css";
import { OpeningScene } from "./OpeningScene";

export const metadata: Metadata = {
  title: "绯夜酒馆",
  description: "一间仅为成年虚构人物开门的标签特调酒馆。",
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
        <meta name="theme-color" content="#100709" />
      </head>
      <body>
        <OpeningScene />
        {children}
      </body>
    </html>
  );
}
