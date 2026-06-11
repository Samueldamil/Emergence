"use client";

import Lottie from "lottie-react";
import searchAnimation from "@/lotties/search.json";

export default function LoadingSearch() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-white">
            <div className="w-64">
                <Lottie animationData={searchAnimation} loop={true} />
            </div>
        </div>
    )
}