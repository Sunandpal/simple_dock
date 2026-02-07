"use client"
import dynamic from 'next/dynamic';

const SplineScene = dynamic(() => import('./SplineScene'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center text-slate-400">Loading 3D Scene...</div>,
});

export default function Hero3D() {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <SplineScene />
        </div>
    );
}
