import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Habit Tracker : No Sign-up or Login",
  description: "Track daily habits with an interactive grid, XP insights, and optional Google Sheets sync inside the Habit Tracker web app.",
  keywords: ["habit tracker", "habit app", "daily habits", "productivity tracker", "google sheets sync"],
  authors: [{ name: "Habit Tracker" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Habit Tracker",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "Habit Tracker",
    title: "Habit Tracker Cloud Sync App",
    description: "Monitor streaks, XP, and trends while syncing habits to Google Sheets in minutes.",
    url: "https://habit-tracker.fun/",
  },
  twitter: {
    card: "summary",
    title: "Habit Tracker Cloud Sync App",
    description: "Monitor streaks, XP insights, and trend charts with seamless Google Sheets syncing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-E9YNJ2TWT3"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-E9YNJ2TWT3');
          `}
        </Script>
        
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2981343356966723"
          crossOrigin="anonymous"
        />
        
        <meta name="google-adsense-account" content="ca-pub-2981343356966723" />
        <meta name="theme-color" content="#c9f0cb" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.variable} ${outfit.variable}`}>
        {children}
      </body>
    </html>
  );
}
