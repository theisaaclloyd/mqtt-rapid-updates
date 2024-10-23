import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

// Import Inter for primary sans-serif text
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Use Geist Mono for monospace elements
const fontMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MQTT Messaging",
  description: "Real-time messaging application with MQTT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable,
          "dark" // Force dark mode - remove if you want to support both
        )}
      >
        {children}
      </body>
    </html>
  );
}
