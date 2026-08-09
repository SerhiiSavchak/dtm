import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-dtm",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
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
  themeColor: "#0d0d0f",
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
      className={`${interTight.variable} ${jetbrainsMono.variable} bg-background antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
