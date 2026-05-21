import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { amenity, lat, lon } = body;

        if (!amenity || !lat || !lon) {
            return NextResponse.json({ error: "Missing required fields"}, { status: 400 });
        }

       const categoryMap: Record<string, string> = {
        hospital: "healthcare.hospital",
        pharmacy: "healthcare.pharmacy",
        police: "service.police",
        fire_station: "service.fire_station",
       };

       const category = categoryMap[amenity] || "healthcare.hospital";

       const url = new URL("https://api.geoapify.com/v2/places");

       url.searchParams.append("categories", category);
       url.searchParams.append("filter", `circle:${lon},${lat},10000`);
       url.searchParams.append("limit", "20");
       url.searchParams.append("apiKey", process.env.GEOAPIFY_API_KEY || "");

        const res = await fetch(url.toString());

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: `Geoapify Error: ${res.status}`, details: data }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });

    }
}