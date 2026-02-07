"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Filter, ShieldAlert, ShieldCheck, MoreHorizontal, FileDown, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { API_BASE_URL } from "@/lib/config"

interface DriverSummary {
    driver_phone: string
    carrier_name: string
    total_visits: number
    last_visit: string // ISO string
    status: string
}

export default function CarrierDatabase() {
    const [drivers, setDrivers] = useState<DriverSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/drivers/`)
                if (res.ok) {
                    const data = await res.json()
                    setDrivers(data)
                }
            } catch (error) {
                console.error("Failed to fetch drivers", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDrivers()
    }, [])

    const toggleBan = (phone: string) => {
        setDrivers(drivers.map(d => {
            if (d.driver_phone === phone) {
                return { ...d, status: d.status === "Active" ? "Banned" : "Active" }
            }
            return d
        }))
    }

    const escapeCsv = (str: string) => {
        if (typeof str !== "string") return str
        return `"${str.replace(/"/g, '""')}"`
    }

    const handleExport = () => {
        const headers = ["Driver Name", "Carrier", "Phone", "Total Visits", "Last Visit", "Status"]
        const rows = drivers.map(d => [
            "N/A",
            escapeCsv(d.carrier_name),
            escapeCsv(d.driver_phone),
            d.total_visits,
            d.last_visit,
            d.status
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `drivers_${format(new Date(), "yyyy-MM-dd")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const filteredDrivers = drivers.filter(d =>
        d.driver_phone.toLowerCase().includes(search.toLowerCase()) ||
        d.carrier_name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <Link href="/admin">
                    <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Driver Registry</h1>
                    <p className="text-slate-500 mt-1">
                        Automated directory of {drivers.length} unique drivers operating at the facility.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search drivers or carriers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                </div>
                <Button variant="outline" className="hidden sm:flex">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[250px]">Driver Name</TableHead>
                            <TableHead>Carrier / Company</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>History</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                    Loading registry...
                                </TableCell>
                            </TableRow>
                        ) : filteredDrivers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                    No drivers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDrivers.map((driver) => (
                                <TableRow key={driver.driver_phone} className="hover:bg-slate-50/50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {driver.carrier_name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-slate-900">N/A</div>
                                                <div className="text-xs text-slate-500">Driver Name</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                                            {driver.carrier_name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-600">
                                        {driver.driver_phone}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900">{driver.total_visits}</span>
                                            <span className="text-xs text-slate-500">visits</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {format(new Date(driver.last_visit), "PP p")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={driver.status === "Active" ? "outline" : "destructive"}
                                            className={driver.status === "Active"
                                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                            }
                                        >
                                            {driver.status === "Active" ? (
                                                <ShieldCheck className="mr-1 h-3 w-3" />
                                            ) : (
                                                <ShieldAlert className="mr-1 h-3 w-3" />
                                            )}
                                            {driver.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(driver.driver_phone)}>
                                                    Copy Phone
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => toggleBan(driver.driver_phone)}
                                                    className={driver.status === "Active" ? "text-red-600" : "text-green-600"}
                                                >
                                                    {driver.status === "Active" ? "Ban Driver" : "Unban Driver"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
