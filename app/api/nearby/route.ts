import { error } from "console";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
    try {
        const { lat, lon, type } = await req.json();

        if (!lat || !lon || !type) {
            NextResponse.json({ error: "Missing required field" }, { status: 400 });
        }

        const query = `
            [out:json];
            (
                node["amenity"="${type}"](around:10000,${lat},${lon});
                way["amenity"="${type}"](around:10000,${lat},${lon});
            );
            out center;
        `;

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 20000);

        const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
            },
            body: query,
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to nearby places..." }, { status: 500 });
        }

        const data = await res.json();

        return NextResponse.json(data);
    } catch (error) {
        console.log(error);
        NextResponse.json({ error: "Request timout or server error" }, { status: 500 });
    }
}