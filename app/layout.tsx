import type { Metadata } from "next";
import Link from "next/link";
import { CANONICAL_SITE_URL, getSiteSettings } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Tailvori", template: "%s | Tailvori" },
  description: "Register a Tailvori pet ID tag and help lost pets get home safely.",
  metadataBase: new URL(CANONICAL_SITE_URL)
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <html lang="en">
      <body>
        <main className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="mark">TV</span>
              <strong>{settings.brandName}</strong>
            </Link>
            <nav className="nav">
              <Link href="/activate">Activate</Link>
              <Link href="/dashboard">My pets</Link>
              <Link href="/auth">Sign in</Link>
            </nav>
          </header>
          {children}
          <footer className="footer">
            <span>{settings.brandName}</span>
            <nav aria-label="Legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href={`mailto:${settings.supportEmail}`}>Support</a>
            </nav>
          </footer>
        </main>
      </body>
    </html>
  );
}
