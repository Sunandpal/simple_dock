"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Calendar, Database, Settings, LogOut, Warehouse } from "lucide-react"

export function Sidebar() {
    const pathname = usePathname()

    const links = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Docks", href: "/admin/docks", icon: Warehouse },
        { name: "Dock Schedule", href: "/admin/schedule", icon: Calendar },
        { name: "Carrier Database", href: "/admin/carriers", icon: Database },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ]

    return (
        <div className="hidden border-r bg-white/70 backdrop-blur-md w-64 md:flex md:flex-col min-h-screen fixed left-0 top-0 bottom-0 z-50">
            <div className="p-6 border-b flex items-center justify-center">
                <h1 className="font-bold text-2xl tracking-tight text-indigo-600">SimpleDock</h1>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {link.name}
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </Link>
            </div>
        </div>
    )
}
