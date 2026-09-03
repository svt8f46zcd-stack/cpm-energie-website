import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const plz = request.nextUrl.searchParams.get("plz")?.trim() ?? "";

  if (!/^\d{5}$/.test(plz)) {
    return NextResponse.json({ locations: [] });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&postalcode=${encodeURIComponent(plz)}&country=Deutschland&addressdetails=1&limit=20&accept-language=de`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "CPM-Energie-Tarifrechner/1.0 (cpm-energie.de)",
        },
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ locations: [] }, { status: 502 });
    }

    const data = await response.json();
    const locations = Array.from(
      new Set(
        (Array.isArray(data) ? data : [])
          .map((item) => {
            const a = item?.address ?? {};
            return a.city || a.town || a.municipality || a.village || a.suburb || "";
          })
          .filter(Boolean)
      )
    ).map((city) => ({ city }));

    return NextResponse.json({ locations });
  } catch {
    return NextResponse.json({ locations: [] }, { status: 502 });
  }
}
