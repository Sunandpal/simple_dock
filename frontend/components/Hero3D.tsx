"use client"
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const SplineScene = dynamic(() => import('./SplineScene'), {
    ssr: false,
})

export default function Hero3D() {
    const [isLoaded, setIsLoaded] = useState(false)

    return (
        <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
            {/* Placeholder / Loader */}
            <div
                className={`absolute inset-0 flex items-center justify-center bg-slate-950 transition-opacity duration-700 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
            >
                {/* Static Image */}
                <img
                    src="/spline-placeholder.png"
                    alt="3D Scene Placeholder"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                />

                {/* Spinner Overlay */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-400 font-medium">Loading 3D Scene...</p>
                </div>
            </div>

            {/* 3D Scene */}
            <SplineScene onLoad={() => setIsLoaded(true)} />
        </div>
    )
}
