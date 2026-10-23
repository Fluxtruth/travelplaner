import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GamificationProvider } from "@/context/GamificationContext";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boystrip - Kollaborative Reiseplanung & Abstimmung",
  description:
    "Echtzeit Multi-User Reiseplanungs-App mit Swipe-Voting für Flixbus, Bahn & Airbnb sowie interaktiver Drag-and-Drop Timeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
        >
          {`
            try {
              const saved = localStorage.getItem('boystrip_theme');
              if (saved === 'dark') {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
                document.documentElement.setAttribute('data-theme', 'dark');
              } else {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
                document.documentElement.setAttribute('data-theme', 'light');
              }
            } catch (e) {}
          `}
        </Script>
      </head>
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 antialiased flex flex-col`}>
        <ThemeProvider>
          <AuthProvider>
            <GamificationProvider>
              <Navbar />
              <main className="flex-1 flex flex-col w-full min-w-0 max-w-full overflow-x-clip">{children}</main>
              <Footer />
            </GamificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
