"use client";

export const dynamic = "force-dynamic";

import { IoArrowBack } from "react-icons/io5";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import getDistance from "geolib/es/getPreciseDistance";

type Place = {
    id: string;
    name: string;
    address: string;
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

   const radiusMap: Record<string, number> = {
    hospital: 20000,
    pharmacy: 15000,
    police: 20000,
    fire_station: 30000,
   };

   useEffect(() => {
    if (!type) return;

    let fetched = false;

    const watchId = navigator.geolocation.watchPosition(async (position) => {

        try {
            const { latitude, longitude, accuracy } = position.coords;

            console.log("Location:", latitude, longitude, "Accuracy:", accuracy);

            if (accuracy > 3000) {
                console.log("Low GPS accuracy, but continuing...");
            }

            if (fetched) return;

            fetched = true;

            navigator.geolocation.clearWatch(watchId);

            const radius = radiusMap[type] || 10000;

            let amenityFilter = "";

            if (type === "hospital") {
                amenityFilter = '["amenity"~"hospital|clinic|doctors"]';
            } else if (type === "pharmacy") {
                amenityFilter = '["amenity"="pharmacy"]';
            } else if (type === "police") {
                amenityFilter = '["amenity"="police"]';
            } else if (type === "fire_station") {
                amenityFilter = '["amenity"="fire_station"]';
            }

            const query = `
                [out:json][timeout:25];
                (
                    node${amenityFilter}(around:${radius},${latitude},${longitude});
                    way${amenityFilter}(around:${radius},${latitude},${longitude});
                    relation${amenityFilter}(around:${radius},${latitude},${longitude});
                );
                out body center;
            `

            const controller = new AbortController();

            const timeout = setTimeout(() => {
                controller.abort();
            }, 45000);

            console.log(query);

            const res = await fetch("https://overpass.private.coffee/api/interpreter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!res.ok) {
                console.log(res.status);

                const errorText = await res.text();
                console.log(errorText);

                setError("Failed to fetch nearby places");
                setLoading(false);
                return;
            }

            const data = await res.json();

            console.log(data);

            const formatted = data.elements.map((item: any) => {
                const placeLat = item.lat || item.center?.lat;
                const placeLon = item.lon || item.center?.lon;

                if (!placeLat || !placeLon) return  null;

                const distanceInMeters = getDistance({ latitude, longitude }, { latitude: placeLat, longitude: placeLon });

                const address = [
                    item.tags?.["addr:housenumber"],
                    item.tags?.["addr:street"],
                    item.tags?.["addr:city"],
                    item.tags?.["addr:district"],
                    item.tags?.["addr:state"],
                ].filter(Boolean).join(", ");

                const fallbackAddress = address || item.tags?.["addr:full"] || item.tags?.["contact:address"] || `${placeLat.toFixed(5)}` || `${placeLon.toFixed(5)}`;

                return {
                    id: item.id.toString(),
                    name: item.tags?.name || "Unnamed Place",
                    address: fallbackAddress,
                    lat: placeLat,
                    lon: placeLon,
                    distance: distanceInMeters < 1000 ? `${distanceInMeters} m` : `${(distanceInMeters / 1000).toFixed(1)} km`,
                };
            }).filter(Boolean);

            formatted.sort((a: Place, b: Place) => parseFloat(a.distance) - parseFloat(b.distance));
            setPlaces(formatted as Place[]);
            setLoading(false);
        } catch(error: any) {
            console.log(error);
           if (error.name === "AbortError") {
            setError("Request Timeout");
           } else {
            setError("Something went wrong.");
           }
            setLoading(false);
        }
    }, 
    (error) => {
        console.log(error);
        if (error.code === 1) {
            setError("Location permission denied");
        } else if (error.code === 2) {
            setError("Location unavailable");
        } else if (error.code === 3) {
            setError("Location request timed out");
        } else {
            setError("Failed to get location");
        }
        setLoading(false);
    }, {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0,
    });

    return () => {
        navigator.geolocation.clearWatch(watchId);
    };
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
                        
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`} target="_blank" className="text-sm text-green-600 font-medium">
                            Get Direction
                        </a>
                    </div>
                ))}
            </div>
        </main>
    );
}