import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "pixelcode.in - Retail POS & Inventory Management System",
  description: "High-performance POS billing, granular inventory management, thermal printing, multi-language support, and automated Khata management.",
};

import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { StorageProvider } from "@/lib/storage/StorageContext";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StorageProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </StorageProvider>
      </body>
    </html>
  );
}
