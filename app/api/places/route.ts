import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { amenity, lat, lon } = body;

        if (!amenity || !lat || !lon) {
            return NextResponse.json({ error: "Missing required fields"}, { status: 400 });
        }

        const query = `
            [out:json][timeout:25];
            (
                node["amenity"="${amenity}"](around:10000,${lat},${lon});
            );
            out center qt;
        `;

         const res = await fetch("https://lz4.overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
            headers: {
                "Content-Type": "text/plain",
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: `Overpass Error: ${res.status}}`}, {status: res.status});
        }

        const data = await res.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch nearby places."}, { status: 500 });

    }
}