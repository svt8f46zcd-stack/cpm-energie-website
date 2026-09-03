import { NextRequest, NextResponse } from "next/server";

type NominatimResult = {
  display_name?: string;
  address?: {
    postcode?: string;
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    suburb?: string;
    road?: string;
    pedestrian?: string;
    footway?: string;
    house_number?: string;
  };
};

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

async function searchNominatim(query: string, limit = 50): Promise<NominatimResult[]> {
  const url = new URL(NOMINATIM);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "de");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("accept-language", "de");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "CPM-Energie-Tarifrechner/1.0 (cpm-energie.de)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) throw new Error("Nominatim unavailable");
  return response.json();
}

function getCity(address: NonNullable<NominatimResult["address"]>) {
  return address.city || address.town || address.municipality || address.village || address.suburb;
}

export async function GET(request: NextRequest) {
  const postalCode = (request.nextUrl.searchParams.get("postalCode") || "").trim();
  const city = (request.nextUrl.searchParams.get("city") || "").trim();
  const street = (request.nextUrl.searchParams.get("street") || "").trim();

  if (!/^\d{5}$/.test(postalCode)) {
    return NextResponse.json({ cities: [], streets: [], addresses: [] });
  }

  try {
    const query = [street, city, postalCode, "Deutschland"].filter(Boolean).join(", ");
    const results = await searchNominatim(query, 50);

    const exact = results.filter((item) => item.address?.postcode === postalCode);

    const cities = Array.from(
      new Map(
        exact
          .map((item) => getCity(item.address || {}))
          .filter(Boolean)
          .map((name) => [name!.toLowerCase(), name!])
      ).values()
    ).slice(0, 10);

    const streets = Array.from(
      new Map(
        exact
          .map((item) => item.address?.road || item.address?.pedestrian || item.address?.footway)
          .filter(Boolean)
          .map((name) => [name!.toLowerCase(), name!])
      ).values()
    )
      .filter((name) => !street || name.toLowerCase().includes(street.toLowerCase()))
      .slice(0, 12);

    const addresses = exact
      .map((item) => ({
        street: item.address?.road || item.address?.pedestrian || item.address?.footway,
        houseNumber: item.address?.house_number,
        postalCode,
        city: getCity(item.address || {}),
      }))
      .filter((item) => item.street && item.city);

    return NextResponse.json(
      { cities, streets, addresses: addresses.slice(0, 20) },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return NextResponse.json(
      { cities: [], streets: [], addresses: [], error: "Adressdienst momentan nicht verfügbar" },
      { status: 502 }
    );
  }
}
