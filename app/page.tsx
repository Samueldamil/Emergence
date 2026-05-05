"use client"
import { GiSiren } from "react-icons/gi";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-gray-200">
      {/* App Name */}
      <div className="flex items-center gap-3 mb-4">
        <GiSiren className="text-4xl font-bold text-red-600" />
        <h1 className="text-4xl font-bold text-red-600">Emergence</h1>
      </div>

      {/* Description */}
      <p className="text-gray-600 max-w-md mb-8">Quickly find nearby hospitals, police stations, fire stations, and pharmacies when you need them most.</p>

      {/* CTA Button */}
      <button onClick={() => router.push("/select")} className="bg-red-500 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-lg transition duration-600 ease-in-out">Find Help Near Me</button>
    </main>
  );
}
