import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const query = await req.text();

        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `data=${encodeURIComponent(query)}`,
        });

        const text = await response.text();
        return new NextResponse(text, {
            status: response.status,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to fetch Overpass data" }, { status: 500 });
    }
}