import type { Metadata, Viewport } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DTM — Дім Твоєї Мрії · Комплексний ремонт у Львові",
  description:
    "DTM — комплексний ремонт квартир, будинків і комерційних просторів у Львові під ключ. Кошторис, організація робіт, прораб, комплектація та контроль виконання.",
  metadataBase: new URL("https://dtm.example"),
  openGraph: {
    title: "DTM — Дім Твоєї Мрії",
    description:
      "Комплексний ремонт квартир, будинків і комерційних просторів у Львові.",
    locale: "uk_UA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1917",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uk"
      className={`${manrope.variable} ${geistMono.variable} bg-background antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
