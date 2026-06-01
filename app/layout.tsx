import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Makuake Gadget Weekly Scout",
  description:
    "Makuakeのもうすぐ開始からガジェット系プロジェクトを選抜し、ショート動画台本を作成するダッシュボード"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
