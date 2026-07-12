import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PetTag ID",
  description: "宠物吊牌激活与防丢资料系统"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="mark">PT</span>
              <strong>PetTag ID</strong>
            </Link>
            <nav className="nav">
              <Link href="/activate">激活</Link>
              <Link href="/dashboard">我的宠物</Link>
              <Link href="/auth">登录 / 注册</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
