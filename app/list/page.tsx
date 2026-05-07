import { Suspense } from "react";
import ListPage from "./ListPage";

export default function Page() {
    return (
        <Suspense fallback={<p className="p-4">Loading nearby places...</p>}>
            <ListPage />
        </Suspense>
    );
}