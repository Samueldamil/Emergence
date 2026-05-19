import { Suspense } from "react";
import MapPage from "./MapPage";

export default function Page() {
    return (
        <Suspense fallback={<p>Loading emergency map...</p>}>
            <MapPage />
        </Suspense>
    );
}