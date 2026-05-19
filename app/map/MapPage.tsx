"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
    ssr: false,
    loading: () => (
        <div className="h-screen flex items-center justify-center">
            <p className="text-lg font-semibold">Loading map...</p>
        </div>
    ),
});

export default function MapPage() {
    return <LeafletMap />;
}