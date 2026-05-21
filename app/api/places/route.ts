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

       const geoUrl = new URL("https://api.geoapify.com/v2/places");

       geoUrl.searchParams.append("categories", category);
       geoUrl.searchParams.append("filter", `circle:${lon},${lat},10000`);
       geoUrl.searchParams.append("limit", "20");
       geoUrl.searchParams.append("apiKey", process.env.GEOAPIFY_API_KEY || "");

        const geoRes = await fetch(geoUrl.toString());

        const geoData = await geoRes.json();


        if (geoData.features && geoData.features.length > 0) {
            return NextResponse.json({
                source: "geoapify",
                data: geoData,
            });
        }

        const overpassQuery = `
            [out:json][timeout:25];
            (
                node["amenity"="${amenity}"](around:20000,${lat},${lon});
            );
            out center;
        `;

        const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: overpassQuery,
        });

        const overpassText = await overpassRes.text();
        let overpassData;

        try {
            overpassData = JSON.parse(overpassText);
        } catch (error) {
            return NextResponse.json({
                error: "Both APIs failed",
            }, { status: 500 });
        }

        return NextResponse.json({
            source: "overpass",
            data: overpassData,
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });

    }
}