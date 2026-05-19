"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import { Marker, MapContainer, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { IoArrowBack } from "react-icons/io5";

type Place = {
    id: number;
    lat: number;
    lon: number;
    distance: number;
    tags: {
        name?: string;
        amenity?: string;
    };
};

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinalUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function LeafletMap() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get("type");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [places, setPlaces] = useState<Place[]>([]);
    const [userPos, setUserPos] = useState<{ lat: number, lon: number } | null>(null);


    useEffect(() => {
        if (!type) return;

        navigator.geolocation.getCurrentPosition(async (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            setUserPos({
                lat: userLat,
                lon: userLon
            });

            await getNearbyPlaces(type, userLat, userLon);
        },
        (error) => {
            console.log(error);
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    setError("Location permission denied.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    setError("Location unavailable");
                    break;
                case error.TIMEOUT:
                    setError("Location request timed out.");
                    break;
                default:
                    setError("Unable tor etrieve location");
            }
            setLoading(false);
        }, {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
        });
    }, [type]);

    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const R = 6371;

        const dLat = ((lat2 - lat1) * Math.PI) / 180;

        const dLon = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c =  2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const getNearbyPlaces = async(amenity: string, userLat: number, userLon: number) => {
       

        try {
           const res = await fetch("/api/places", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ amenity, lat: userLat, lon: userLon }),
           });

            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status}`);
            }

            const data = await res.json();

            const formatted = data.elements.map((place: any) => ({
                ...place,
                distance: calculateDistance(userLat, userLon, place.lat, place.lon),
            }));

            formatted.sort((a: Place, b: Place) => a.distance - b.distance);

            setPlaces(formatted);
        } catch (error: any) {
            console.log(error);
            setError(error.message || "Failed to fetch nearby places");
        } finally {
            setLoading(false);
        }
    };

    const formatDistance = (distance: any) => {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m away`;
        }
        
        return `${distance.toFixed(1)}km away`;
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="font-semibold text-lg">Finding nearby emergency center...</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center px-6">
                <p className="font-medium text-center text-red-600">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-black mt-4 px-4 py-2 rounded-lg text-white">
                    Retry
                </button>
            </div>
        );
    }

    if (!userPos) {
        return null;
    }

    return(
        <main className="h-screen relative w-full">
            <button onClick={() => router.back()} className="absolute top-4 left-4 z-[1000] bg-white shadow-lg p-2 rounded-full hover:bg-gray-500 transition duration-600">
                <IoArrowBack className="text-xl" />
            </button>

            <div className="absolute top-4 left-20 z-[1000] rounded-xl bg-white px-4 py-2 shadow-lg">
                <h1 className="font-semibold capitalize">
                    Nearby{" "}
                    {type?.replace("_", " ")}
                </h1>
            </div>

            <MapContainer center={[userPos.lat, userPos.lon]} zoom={14} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap contributors" />

                <Marker position={[userPos.lat, userPos.lon]}>
                    <Popup>You are here</Popup>
                </Marker>

                {places.map((place) => (
                    <Marker key={place.id} position={[place.lat, place.lon]}>
                        <Popup>
                            <div className="space-y-2">
                                <h2 className="font-bold">{place.tags.name || "Unnamed Place"}</h2>
                                <p className="text-sm capitalize text-gray-600">{place.tags.amenity?.replace("_", " ")}</p>
                                <p className="text-sm text-green-600 font-medium">{formatDistance(place.distance)}</p>
                                <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`} target="_blank" className="text-blue-600 underline text-sm">
                                    Get Direction
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </main>
    )
}