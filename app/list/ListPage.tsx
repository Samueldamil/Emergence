"use client";

export const dynamic = "force-dynamic";

import { IoArrowBack } from "react-icons/io5";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import getDistance from "geolib/es/getPreciseDistance";

type Place = {
    id: number;
    name: string;
    address: string;
    lat: number;
    lon: number;
    distance: string;
};

type GeoApifyResponse = {
    features: {
        properties: {
            place_id: string;
            name?: string;
            formatted?: string;
            lat: number;
            lon?: number;
        };
    }[];
};

export default function ListPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get('type');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [places, setPlaces] = useState<Place[]>([]);

   const categoryMap: Record<string, string> = {
    hospital: "healthcare.hospital",
    pharmacy: "healthcare.pharmacy",
    police: "service.police",
    fire_station: "service.fire_station"
   };

   useEffect(() => {
    if (!type) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const { latitude, longitude } = position.coords;

            const category = categoryMap[type];

            if (!category) {
                setError("Invalid place type");
                setLoading(false);
                return;
            }

            const api_key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

            if (!api_key) {
                setError("Missing api key");
                setLoading(false);
                return;
            }

            const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${longitude},${latitude},5000&bias=proximity:${longitude},${latitude}&limit=20&apiKey=${api_key}`;

            const res = await fetch(url);

            if (!res.ok) {
                setError("Failed to fetch nearby places");
                setLoading(false);
                return;
            }

            const data: GeoApifyResponse = await res.json();

            const formatted = data.features.map((item: any) => {
                const props = item.properties;

                const distanceInMeters = getDistance({ latitude, longitude }, { latitude: props.lat, longitude: props.lon });

                return {
                    id: props.place_id,
                    name: props.name || "Unnamed Place",
                    address: props.formatted || "No address available",
                    lat: props.lat,
                    lon: props.lon,
                    distance: (distanceInMeters / 1000).toFixed(1) + "km",
                };
            });

            formatted.sort((a: Place, b: Place) => parseFloat(a.distance) - parseFloat(b.distance));
            setPlaces(formatted);
            setLoading(false);
        } catch(error) {
            console.log(error);
            setError("Something went wrong.")
            setLoading(false);
        }
    }, 
    (error) => {
        console.log(error);
        setError(error.message);
        setLoading(false);
    }, {
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

            {!loading && places.length === 0 && !error && (<p className="text-gray-600">No places found nearby.</p>)}

            <div className="space-y-4">
                {places.map((place) => (
                    <div key={place.id} className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="font-semibold text-lg">{place.name}</h2>
                        <p className="text-xs text-gray-400">{place.distance} away</p>
                        {place.address && (
                            <p className="text-sm text-gray-600">{place.address}</p>
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