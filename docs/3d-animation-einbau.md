# 3D-Hero-Animation einbauen (Energiekugel)

Diese Anleitung zeigt, wie du die neue 3D-Animation in deine bestehende Startseite einbindest, ohne vorhandenen Code zu verlieren.

## 1. Abhaengigkeiten installieren

Fuege folgende Pakete zu deiner `package.json` hinzu (per `npm install` lokal ausfuehren oder manuell in `dependencies` eintragen):

```
npm install three @react-three/fiber @react-three/drei
```

## 2. Komponente in die Startseite einbinden

Oeffne `app/page.tsx` und ergaenze ganz oben den Import:

```tsx
import EnergyOrbSection from "@/components/EnergyOrbSection";
```

Binde dann `<EnergyOrbSection />` im Hero-Bereich ein, z. B. neben deiner Ueberschrift und dem Call-to-Action-Button, etwa so:

```tsx
<div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
  <div>
    {/* dein bestehender Hero-Text und Button */}
  </div>
  <EnergyOrbSection />
</div>
```

Falls dein Projekt keinen `@/`-Pfad-Alias nutzt, verwende stattdessen einen relativen Import wie:

```tsx
import EnergyOrbSection from "../components/EnergyOrbSection";
```

## 3. Was die Animation macht

- Zeigt eine sanft rotierende, leicht pulsierende gruene Energiekugel mit Glow-Effekt und funkelnden Partikeln.
- Folgt dezent der Mausbewegung (Parallax-Effekt).
- Respektiert die Systemeinstellung "Bewegung reduzieren": In diesem Fall wird statt der 3D-Szene ein einfacher, performanter Verlaufskreis angezeigt.
- Wird nur clientseitig geladen (dynamic import, ssr: false), damit der Vercel-Build stabil bleibt und keine Server-Rendering-Probleme mit Three.js auftreten.

## 4. Testen

Nach `npm install` und dem Einbau lokal testen mit:

```
npm run dev
```

Die Kugel sollte im Hero-Bereich erscheinen und auf Mausbewegung reagieren. Auf Vercel wird sie automatisch mitdeployt, sobald du diese Aenderungen commitest und pushst.
