import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { amenity, lat, lon } = body;

        if (!amenity || !lat || !lon) {
            return NextResponse.json({ error: "Missing required fields"}, { status: 400 });
        }

       const categoryMap: Record<string, string> = {
        hospital: "healthcare.hospital,healthcare.clinic",
        pharmacy: "healthcare.pharmacy",
        police: "service.police",
        fire_station: "service.fire_station",
       };

       const category = categoryMap[amenity] || "healthcare.hospital";

       const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lon},${lat},10000&limit=20&apiKey=${process.env.GEOAPIFY_API_KEY}`;

        const res = await fetch(url);

        if (!res.ok) {
            return NextResponse.json({ error: `Geoapify Error: ${res.status}` }, { status: res.status });
        }

        const data = await res.json();

        return NextResponse.json(data);
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });

    }
}