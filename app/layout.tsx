import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { SubscriptionProvider } from "./context/SubscriptionContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MbeejFepal - Gestion Hotspot",
  description: "Gérez vos routeurs et vos forfaits WiFi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {/* ✅ TOASTER PROFESSIONNEL (Dark Theme) */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#111827', // gray-900
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            },
            success: {
              iconTheme: {
                primary: '#10b981', // Vert émeraude
                secondary: '#111827',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444', // Rouge
                secondary: '#111827',
              },
            },
          }} 
        />
        
        {/* Le Provider d'abonnement */}
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </body>
    </html>
  );
}