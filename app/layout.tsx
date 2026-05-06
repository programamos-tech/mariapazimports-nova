import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? "programamos templates";

export const metadata: Metadata = {
  title: storeName,
  description: "Plantilla de tienda — catálogo, carrito y pagos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="flex min-h-full flex-col bg-white text-stone-800">
        {children}
      </body>
    </html>
  );
}
