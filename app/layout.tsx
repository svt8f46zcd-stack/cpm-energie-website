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
    default: "Strom & Gas Rechnung prüfen | CPM Energie",
    template: "%s | CPM Energie",
  },
  description:
    "Lade deine Strom- oder Gasrechnung hoch. CPM Energie analysiert Verbrauch, Arbeitspreis und Grundpreis kostenlos, unverbindlich und persönlich erklärt.",
  keywords: [
    "stromrechnung prüfen",
    "gasrechnung analyse",
    "energieberater",
    "tarifcheck",
    "strom sparen",
    "gas sparen",
    "stromtarif prüfen",
    "gast arif prüfen",
  ],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Strom & Gas Rechnung prüfen | CPM Energie",
    description:
      "Kostenlose Tarifanalyse in 30 Sekunden. Digital geprüft und persönlich erklärt.",
    url: "https://cpm-energie.de",
    siteName: "CPM Energie",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Strom & Gas Rechnung prüfen | CPM Energie",
    description:
      "Kostenlose Tarifanalyse. Digital geprüft und persönlich erklärt.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "CPM Energie",
  description: "Persönliche Strom- und Gas-Tarifanalyse.",
  url: "https://cpm-energie.de",
  priceRange: "€€",
  areaServed: {
    "@type": "Country",
    name: "Deutschland",
  },
  serviceType: [
    "Stromtarifprüfung",
    "Gastarifprüfung",
    "Energieberatung",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
