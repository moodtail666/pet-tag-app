import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pet Tag ID",
  description: "Register a pet ID tag and help lost pets get home safely."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="mark">PT</span>
              <strong>Pet Tag ID</strong>
            </Link>
            <nav className="nav">
              <Link href="/activate">Activate</Link>
              <Link href="/dashboard">My pets</Link>
              <Link href="/auth">Sign in</Link>
            </nav>
          </header>
          {children}
          <footer className="footer">
            <span>Pet Tag ID</span>
            <nav aria-label="Legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
          </footer>
        </main>
      </body>
    </html>
  );
}
