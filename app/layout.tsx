import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cpm-energie.de"),
  title: {
    default: "CPM Energie | Strom & Gas kostenlos prüfen",
    template: "%s | CPM Energie",
  },
  description:
    "CPM Energie prüft kostenlos und unverbindlich Ihren Strom- und Gastarif und zeigt Ihnen mögliche Einsparpotenziale.",
  openGraph: {
    title: "CPM Energie | Strom & Gas kostenlos prüfen",
    description: "Kostenlose Tarifprüfung für Privat- und Gewerbekunden.",
    url: "https://cpm-energie.de",
    siteName: "CPM Energie",
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
