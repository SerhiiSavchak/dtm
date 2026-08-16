import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
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
      "DTM — комплексний ремонт квартир, будинків і комерційних приміщень у Львові під ключ. Кошторис, організація робіт, прораб, комплектація та контроль виконання",
  metadataBase: new URL("https://dtm.example"),
  openGraph: {
    title: "DTM — Дім Твоєї Мрії",
    description:
      "Комплексний ремонт квартир, будинків і комерційних приміщень у Львові",
    locale: "uk_UA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#121214",
  width: "device-width",
  initialScale: 1,
};

/** Persist manual choice; default dark — matches CSS :root to avoid FOUC */
const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('dtm-theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  try {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) document.documentElement.setAttribute('data-motion', 'reduce');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uk"
      data-theme="dark"
      className={`${interTight.variable} ${jetbrainsMono.variable} bg-background antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
