import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const SITE_URL = "https://svt8f46zcd-stack.github.io/cpm-energie-website";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    "gastarif prüfen",
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
    url: SITE_URL,
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
  url: SITE_URL,
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
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
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
