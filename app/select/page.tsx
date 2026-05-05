"use client"

import { useRouter } from "next/navigation"
import { FaHospitalAlt, FaFireExtinguisher } from "react-icons/fa";
import { RiPoliceBadgeFill } from "react-icons/ri";
import { GiMedicines } from "react-icons/gi";
import { IoArrowBack } from "react-icons/io5";


export default function SelectEmergency() {
    const router = useRouter();

    const options = [
        {
            name: "Hospital", 
            type: "hospital",
            icon: <FaHospitalAlt className="text-red-500 text-2xl" />
        },
        {
            name: "Police Station", 
            type: "police",
            icon: <RiPoliceBadgeFill className="text-blue-500 text-2xl" />
        },
        {
            name: "Fire Station", 
            type: "fire_station",
            icon: <FaFireExtinguisher className="text-orange-500 text-2xl" />
        },
        {
            name: "Pharmacy", 
            type: "pharmacy",
            icon: <GiMedicines className="text-green-500 text-2xl" />
        }
    ];

    return(
        <main className="min-h-screen px-4 bg-gray-200">
            {/* Top Bar */}
            <div className="py-4 flex items-centers">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-500 transition duration-600">
                    <IoArrowBack className="text-xl" />
                </button>
            </div>

            <div className="flex flex-col items-center justify-center px-4 min-h-screen -mt-16">
                <h1 className="text-2xl font-bold mb-6 text-center">Select Emergency Service</h1>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
                    {options.map((option) => (
                        <button 
                            key={option.type}
                            onClick={() => router.push(`/list?type=${option.type}`)}
                            className="bg-white shadow-md rounded-xl p-4 hover:bg-red-100 transition duration-600 flex flex-col items-center justify-center gap-2"
                        >
                            {option.icon}
                            <span className="text-sm font-medium">
                                {option.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </main>
    );
}