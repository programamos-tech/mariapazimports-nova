import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist_Mono, Montserrat, Playfair_Display } from "next/font/google";
import { storeBrand, storeShortDescription } from "@/lib/brand";
import { ADMIN_SIDEBAR_BG, STORE_CHROME_BG } from "@/lib/admin-theme";
import { STORE_ACCENT, STORE_ACCENT_HOVER } from "@/lib/store-theme";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function supabaseStorageOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

const storageOrigin = supabaseStorageOrigin();

function siteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  return "https://mariapazimports.com";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: storeBrand,
    template: `%s · ${storeBrand}`,
  },
  description: storeShortDescription,
  applicationName: storeBrand,
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: storeBrand,
    title: storeBrand,
    description: storeShortDescription,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: storeBrand,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: storeBrand,
    description: storeShortDescription,
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="preload"
          as="image"
          href="/logo-maria-paz-imports-sm.png"
          type="image/png"
          fetchPriority="high"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {storageOrigin ? (
          <>
            <link rel="preconnect" href={storageOrigin} />
            <link rel="dns-prefetch" href={storageOrigin} />
          </>
        ) : null}
        {/* display=swap + media print→all: no bloquea LCP de fotos de producto */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@200..700&display=swap"
          media="print"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@200..700&display=swap"
          />
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.querySelector('link[href*="Stack+Sans+Notch"][media=print]');if(l)l.media='all';})();`,
          }}
        />
      </head>
      <body
        className="flex min-h-full flex-col bg-white text-stone-800"
        style={
          {
            "--admin-sidebar-bg": ADMIN_SIDEBAR_BG,
            "--store-chrome-bg": STORE_CHROME_BG,
            "--store-accent": STORE_ACCENT,
            "--store-accent-hover": STORE_ACCENT_HOVER,
          } as CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
