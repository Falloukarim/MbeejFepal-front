import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { SubscriptionProvider } from "./context/SubscriptionContext";// Adaptez le chemin selon votre choix
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
        {/* 1. Le Toaster pour react-hot-toast */}
        <Toaster position="top-right" />
        
        {/* 2. Le Provider d'abonnement */}
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </body>
    </html>
  );
}