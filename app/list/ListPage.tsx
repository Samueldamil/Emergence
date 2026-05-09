"use client";

export const dynamic = "force-dynamic";

import { IoArrowBack } from "react-icons/io5";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import getDistance from "geolib/es/getPreciseDistance";

type Place = {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    lat: number;
    lon: number;
    distance: string;
};

export default function ListPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get('type');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [places, setPlaces] = useState<Place[]>([]);

    useEffect(() => {
        if (!type) return;

        const fetchPlaces = async (latitude: number, longitude: number) => {
            try {
                const res = await fetch("/api/nearby", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        lat: latitude,
                        lon: longitude,
                        type
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Failed to fetch places.");
                    setLoading(false);
                    return;
                };

                const formatted = data.elements.map((item: any) => {
                    const address = [
                        item.tags?.["addr:housenumber"],
                        item.tags?.["addr:street"],
                        item.tags?.["addr:city"],
                    ].filter(Boolean).join(", ");

                        
                    const placeLat = item.lat || item.center?.lat;
                    const placeLon = item.lon || item.center?.lon;

                    if (!placeLat || !placeLon) return null;
                        
                    const distanceInMeters = getDistance({ latitude, longitude }, { latitude: placeLat, longitude: placeLon });

                    return {
                        id: item.id,
                        name: item.tags?.name || "Unnamed Place",
                        address: address || null,
                        phone: item.tags?.phone || null,
                        lat: placeLat,
                        lon: placeLon,
                        distance: (distanceInMeters / 1000).toFixed(1) + "km",
                    };
                }).filter(Boolean) as Place[];

                formatted.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

                setPlaces(formatted);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setError("Failed to fetch nearby places.");
                setLoading(false);
            }
        };
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            fetchPlaces(latitude, longitude);
        },  
        (error) => {
            console.log(error);
            setError(error.message);
            setLoading(false);
        }, 
        {
            enableHighAccuracy: true,
            timeout: 10000,
           maximumAge: 0,
        });
    }, [type]);

    return(
        <main className="bg-gray-200 px-4 py-6 min-h-screen">
            <div className="py-4 flex items-center">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-500 transition duration-600">
                    <IoArrowBack className="text-xl" />
                </button>
            </div>

            <h1 className="text-2xl font-bold mb-6 capitalize">Nearby {type?.replace("_", " ")}</h1>

            {loading && <p className="text-gray-600">Finding nearby services...</p>}
            {error && (<p className="text-red-600 font-medium">{error}</p>)}

            {!loading && places.length === 0 && (<p className="text-gray-600">No places found nearby.</p>)}

            <div className="space-y-4">
                {places.map((place) => (
                    <div key={place.id} className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="font-semibold text-lg">{place.name}</h2>
                        <p className="text-xs text-gray-400">{place.distance} away</p>
                        {place.address && (
                            <p className="text-sm text-gray-600">{place.address}</p>
                        )}
                        {place.phone && (
                            <a href={`tel:${place.phone}`} className="text-sm text-blue-500 block">{place.phone}</a>
                        )}
                        
                        <a href={`https://www.google.com/maps?q=${place.lat},${place.lon}`} target="_blank" className="text-sm text-green-600 font-medium">
                            Get Direction
                        </a>
                    </div>
                ))}
            </div>
        </main>
    );
}