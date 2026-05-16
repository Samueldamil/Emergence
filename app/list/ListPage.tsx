"use client";

export const dynamic = "force-dynamic";

import { IoArrowBack } from "react-icons/io5";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import getDistance from "geolib/es/getPreciseDistance";

type Place = {
    id: number;
    lat: number;
    lon: number;
    distance: number;
    tags: {
        name?: string,
        amenity?: string,
    }
};

export default function ListPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get('type');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [places, setPlaces] = useState<Place[]>([]);

   useEffect(() => {
    if (type) {
        getNearbyPlaces(type);
    };
   }, [type]);

   const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
   ) => {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
   };

   const getNearbyPlaces = async (amenity: string) => {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        const query = `
            [out:json];
            (
                node["amenity"="${amenity}"](around:10000,${userLat},${userLon});
            );
            out body;
        `;

        try {
            const res = await fetch("https://overpass.private.coffee/api/interpreter", {
                method: "POST",
                body: query,
                headers: {
                    "Content-Type": "text/plain",
                },
                signal: AbortSignal.timeout(15000),
            });

            if (!res.ok) {
                throw new Error(`HTTP Error ${res.status}`);
            }

            const data = await res.json();

            const formatted = data.elements.map((place: any) => ({
                ...place,
                distance: calculateDistance(
                    userLat,
                    userLon,
                    place.lat,
                    place.lon
                ),
            }));

            formatted.sort((a: Place, b: Place) => {
                 return a.distance - b.distance;
            });

            setPlaces(formatted);
        } catch (error: any) {
            console.log(error)
            setError(error.message || "Something went wrong")
        } finally {
            setLoading(false);
        }
    },
    (error) => {
        console.log(error);
        setLoading(false);
    });
   };

   const formatDistance = (distance: number) => {
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
   }

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

            {!loading && places.length === 0 && !error && (<p className="text-gray-600">No places found nearby.</p>)}

            <div className="space-y-4">
                {places.map((place) => (
                    <div key={place.id} className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="font-semibold text-lg">{place.tags.name || "Unnamed place"}</h2>
                        <p className="text-xs text-gray-400">{formatDistance(place.distance)}</p>
                        <p className="text-sm text-gray-600">{place.tags.amenity?.replace("_", " ")}</p>
                        
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`} target="_blank" className="text-sm text-green-600 font-medium">
                            Get Direction
                        </a>
                    </div>
                ))}
            </div>
        </main>
    );
}