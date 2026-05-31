import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const query = await req.text();

        const response = await fetch("https://overpass.private.coffee/api/interpreter", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Emergency-App",
            },
            body: `data=${encodeURIComponent(query)}`,
        });

        console.log(response.status);

        const text = await response.text();

        console.log(text);
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