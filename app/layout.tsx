import type { Metadata } from "next";
import "./globals.css";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export const metadata: Metadata = {
  title: "Transitland Fleet OS",
  description: "Fleet Operating System for Transitland",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <OfflineIndicator />
      </body>
    </html>
  );
}

