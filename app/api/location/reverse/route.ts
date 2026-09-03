import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Ungültige Koordinaten" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1&accept-language=de`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "CPM-Energie-Tarifrechner/1.0 (cpm-energie.de)",
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return NextResponse.json({ error: "Standortdienst nicht erreichbar" }, { status: 502 });

    const data = await response.json();
    const address = data?.address ?? {};
    const postalCode = typeof address.postcode === "string" ? address.postcode.match(/\b\d{5}\b/)?.[0] : undefined;
    const city = address.city || address.town || address.municipality || address.village || address.suburb;
    const street = address.road || address.pedestrian || address.footway;
    const houseNumber = address.house_number;

    if (!postalCode) return NextResponse.json({ error: "Keine deutsche PLZ für diesen Standort gefunden" }, { status: 404 });

    return NextResponse.json({ postalCode, city: city || undefined, street: street || undefined, houseNumber: houseNumber || undefined }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Standort konnte nicht ermittelt werden" }, { status: 502 });
  }
}
