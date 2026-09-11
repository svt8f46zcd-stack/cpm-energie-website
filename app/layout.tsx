import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./cpm-energy-flow.css";
import "./cpm-inspiration.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const SITE_URL = "https://cpm-energie.de";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "CPM Energie | Strom & Gas persönlich prüfen", template: "%s | CPM Energie" },
  description: "CPM Energie prüft deine Strom- oder Gasrechnung und erklärt dir verständlich Arbeitspreis, Grundpreis und relevante Tarifdaten. Kostenlos und ohne Wechselpflicht.",
  keywords: ["stromrechnung prüfen", "gasrechnung prüfen", "stromtarif prüfen", "gastarif prüfen", "energieberatung", "tarifcheck", "strom sparen", "gas sparen", "Rheinhessen"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  alternates: { canonical: SITE_URL + "/" },
  openGraph: {
    title: "CPM Energie | Strom & Gas persönlich prüfen",
    description: "Strom oder Gas kostenlos prüfen lassen. Persönlich erklärt und ohne Wechselpflicht.",
    url: SITE_URL + "/",
    siteName: "CPM Energie",
    locale: "de_DE",
    type: "website",
    images: [{ url: SITE_URL + "/cristiano.svg", width: 600, height: 900, alt: "Cristiano Moreira von CPM Energie" }],
  },
  twitter: { card: "summary_large_image", title: "CPM Energie | Strom & Gas persönlich prüfen", description: "Strom oder Gas kostenlos prüfen lassen. Persönlich erklärt und ohne Wechselpflicht.", images: [SITE_URL + "/cristiano.svg"] },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "CPM Energie",
  url: SITE_URL,
  description: "Persönliche Beratung und Vermittlung von Strom- und Gastarifen.",
  areaServed: { "@type": "AdministrativeArea", name: "Rheinhessen" },
  serviceType: ["Stromtarifprüfung", "Gastarifprüfung", "Energieberatung"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
