"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { IoArrowBack } from "react-icons/io5";

type POI = {
    name: string;
    lat: number;
    lon: number;
    type: string;
    source: string;
    distance: number;
}

const MapContainer = dynamic(async () => (await import("react-leaflet")).MapContainer, { ssr: false });
const TileLayer = dynamic(async () => (await import("react-leaflet")).TileLayer, { ssr: false });
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, { ssr: false });
const Popup = dynamic(async () => (await import("react-leaflet")).Popup, { ssr: false });
const ZoomControl = dynamic(async () => (await import("react-leaflet")).ZoomControl, { ssr: false });

function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export default function MapPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get("type") || "hospital";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [customIcon, setCustomIcon] = useState<any>(null);

    const [pois, setPois] = useState<POI[]>([]);
    const [location, setLocation] = useState<{
        lat: number;
        lon: number;
    } | null>(null);

    const labelMap: Record<string, string> = {
        hospital: "hospitals",
        pharmacy: "pharmacies",
        police: "police stations",
        fire_station: "fire stations",
    };

    const label = labelMap[type] || "emergency services";

    const googleUrl = `https://www.google.com/maps/search/${encodeURIComponent(label)}/@${location?.lat},${location?.lon},14z`;

    useEffect(() => {
        const loadLeafletIcon = async () => {
            const L = await import("leaflet");

            const icon = L.icon({
                iconRetinaUrl: "/leaflet/marker-icon-2x.png",
                iconUrl: "/leaflet/marker-icon.png",
                shadowUrl: "/leaflet/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });

            setCustomIcon(icon);
        };

        loadLeafletIcon();
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition((pos) => {
            setLocation({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
            });
        },
        (error) => {
            console.log(error);
            setError("Unable to get your location");
        },
        {
            enableHighAccuracy: true,
            timeout: 60000,
            maximumAge: 0,
        });
    }, []);

    const radiusMap: Record<string, number> = {
        hospital: 5000,
        pharmacy: 7000,
        police: 7000,
        fire_station: 10000,
    }

    const searchRadius = radiusMap[type] || 5000;

    useEffect(() => {
        if (!location) return;

        const fetchData = async () => {
            setLoading(true);

            try {
                let results: POI[] = [];

                const geo = await fetchGeoapify(location.lat, location.lon, searchRadius, type);

                results = [...geo];

                if ( results.length === 0) {
                    const overpass = await fetchOverpass(location.lat, location.lon, searchRadius, type);
                    results = [...overpass];
                }

                const unique = Array.from(new Map(results.map((r) => [`${r.lat}-${r.lon}`, r])).values());
                unique.sort((a, b) => a.distance - b.distance);

                setPois(unique);
            } catch (error) {
                console.log(error);
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(String(error));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [location, type]);


    async function fetchOverpass(lat: number, lon: number, radius: number, type: string): Promise<POI[]> {
        const  tagMap: Record<string, string> = {
            hospital: "hospital",
            pharmacy: "pharmacy",
            police: "police",
            fire_station: "fire_station",
        };
        const query = `
            [out:json];
            (
                node["amenity"="${tagMap[type]}"](around:${radius},${lat},${lon});
                way["amenity"="${tagMap[type]}"](around:${radius},${lat},${lon});
                relation["amenity"="${tagMap[type]}"](around:${radius},${lat},${lon});
            );
            out center;
            `;

        const res = await fetch("/api/overpass", {
            method: "POST",
            body: query,
        });

        if (!res.ok) {
            return [];
        }

        const data = await res.json();
        return (data.elements?.map((el: any) => ({
            name: el.tags?.name || "Unknown",
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            type,
            source: "overpass",
            distance: calculateDistance(lat, lon, el.lat || el.center?.lat, el.lon || el.center?.lon),
        })) || []);
    }

    async function fetchGeoapify(lat: number, lon: number, radius: number, type: string): Promise<POI[]> {

        const categoryMap: Record<string, string> = {
            hospital: "healthcare.hospital",
            pharmacy: "healthcare.pharmacy",
            police: "service.police",
            fire_station: "service.fire_station",
        };

        const category = categoryMap[type];

        const url =
            `https://api.geoapify.com/v2/places` +
            `?categories=${encodeURIComponent(category)}` +
            `&filter=circle:${lon},${lat},${radius}` +
            `&limit=20` +
            `&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;

        console.log(url);

        const res = await fetch(url);

        if (!res.ok) {
            return [];
        }

        const data = await res.json();

        return (
            data.features?.map((f: any) => ({
                name: f.properties.name || "Unknown",
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                type,
                source: "geoapify",
                distance: calculateDistance(
                    lat,
                    lon,
                    f.geometry.coordinates[1],
                    f.geometry.coordinates[0]
                ),
            })) || []
        );
    }

    if (!customIcon) return null;

    if (error) {
        return <p className="flex items-center justify-center h-screen w-full text-red-500 text-sm">{error}</p>
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

            {loading && (
                <div className="h-screen w-full flex items-center justify-center">
                    <p className="text-lg font-md">Searching nearby emergency centers...</p>
                </div>
            )}

            {!loading && pois.length === 0 && (
                <div className="h-screen w-full flex items-center justify-center px-6">
                    <div className="bg-white shadow-xl rounded-2xl p-6 max-w-sm text-center space-y-4">
                        <h2 className="text-xl font-bold text-red-500">
                            No Nearby{" "}
                            {type.replace("_", " ")} Found
                        </h2>
                        <p className="text-gray-600 text-sm">Our database could not find nearby {label} in your current location,</p>
                        <p className="text-gray-400 text-sm">Search Google Map for additional results.</p>

                        <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                            Search on Google Map
                        </a>
                    </div>
                </div>
            )}

            {!loading && location && pois.length > 0 && (
                    <MapContainer center={[location.lat, location.lon]} zoom={14} zoomControl={false} className="h-full w-full">

                        <ZoomControl position="bottomright" />

                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

                        <Marker position={[location.lat, location.lon]} icon={customIcon}>
                            <Popup>You are here</Popup>
                        </Marker>

                        {pois.map((poi, index) => (
                            <Marker 
                                key={index} 
                                position={[poi.lat, poi.lon]} 
                                icon={customIcon} 
                            >
                                <Popup>
                                    <div className="space-y-2">
                                        <h2 className="font-bold">{poi.name}</h2>
                                        <p className="text-sm capitalize text-gray-600">{poi.type}</p>
                                        <p className="text-sm font-medium text-red-500">{poi.distance < 1 ? `${Math.round(poi.distance * 1000)}m away` : `${poi.distance.toFixed(1)}km away`}</p>
                                        <p className="text-sm text-green-600 font-medium">Source: {poi.source}</p>
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lon}`} target="_blank" className="block w-full bg-blue-500 text-center py-2 px-4 rounded-lg">
                                            <span className="text-white font-medium">
                                                Navigate with Google Maps
                                            </span>
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )
            }
            
        </main>
    )
}