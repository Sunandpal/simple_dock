"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Truck, ArrowRight } from "lucide-react";
import Hero3D from "@/components/Hero3D";

export default function Home() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-slate-900">

            {/* Layer 1: 3D Background (Full Screen) */}
            <div className="absolute inset-0 z-0">
                <Hero3D />
            </div>

            {/* Layer 2: Shadow Curtain (Gradient Overlay) - Crucial for Contrast */}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-transparent pointer-events-none"></div>

            {/* Layer 3: Content Container (White Text) */}
            <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-16 max-w-4xl">

                {/* Live Status Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/50 backdrop-blur-md px-4 py-1.5 text-xs font-medium text-indigo-200 mb-10 w-fit shadow-lg shadow-indigo-900/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Yard Status: Live & Operational
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight drop-shadow-2xl">
                    Intelligent Dock <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        Scheduling
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-300 mb-12 leading-relaxed max-w-2xl drop-shadow-md font-light">
                    Eliminate detention fees, reduce wait times, and streamline carrier appointments with our automated scheduling platform.
                </p>

                {/* Navigation Cards (Glassmorphism) */}
                <div className="grid gap-6 md:grid-cols-2 max-w-2xl">

                    {/* Admin Card */}
                    <Link href="/admin" className="block group">
                        <Card className="h-full bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl hover:bg-white/10 transition-all duration-300 cursor-pointer group-hover:scale-[1.02] group-hover:border-indigo-500/50">
                            <CardContent className="p-6 flex flex-col gap-4">
                                <div className="h-12 w-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 group-hover:bg-indigo-500/40 transition-colors">
                                    <LayoutDashboard className="h-6 w-6 text-indigo-300 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">Warehouse Manager</h3>
                                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Internal operations portal</p>
                                </div>
                                <div className="mt-auto pt-2 flex items-center text-sm text-indigo-400 font-medium group-hover:text-indigo-200 transition-colors">
                                    View Dashboard <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Carrier Card */}
                    <Link href="/book" className="block group">
                        <Card className="h-full bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl hover:bg-white/10 transition-all duration-300 cursor-pointer group-hover:scale-[1.02] group-hover:border-purple-500/50">
                            <CardContent className="p-6 flex flex-col gap-4">
                                <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-500/40 transition-colors">
                                    <Truck className="h-6 w-6 text-purple-300 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">Carrier Booking</h3>
                                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Book a delivery slot</p>
                                </div>
                                <div className="mt-auto pt-2 flex items-center text-sm text-purple-400 font-medium group-hover:text-purple-200 transition-colors">
                                    Book Appointment <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                </div>
            </div>
        </main>
    );
}
