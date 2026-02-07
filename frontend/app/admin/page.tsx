"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/Sidebar"
import { Truck, Clock, Warehouse, CheckCircle, Plus } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface Booking {
    id: number
    dock_id: number
    start_time: string
    end_time: string
    carrier_name: string
    po_number: string
    status: string
    dock: { name: string }
}

export default function AdminDashboard() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API_BASE_URL}/bookings/`)
            .then((res) => res.json())
            .then((data) => {
                setBookings(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error("Failed to fetch bookings", err)
                setLoading(false)
            })
    }, [])

    // Mock Metrics
    const metrics = [
        { title: "Total Bookings", value: bookings.length.toString(), icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Trucks Waiting", value: "3", icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
        { title: "Docks Available", value: "8", icon: Warehouse, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Completed", value: "12", icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-100" },
    ]

    const escapeCsv = (str: string) => {
        if (typeof str !== "string") return str
        return `"${str.replace(/"/g, '""')}"`
    }

    const handleExport = () => {
        const headers = ["Time Slot", "Carrier", "PO Number", "Dock", "Status"]
        const rows = bookings.map(b => [
            new Date(b.start_time.endsWith("Z") ? b.start_time : b.start_time + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            escapeCsv(b.carrier_name),
            escapeCsv(b.po_number),
            `Dock ${b.dock_id}`,
            b.status
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `dashboard_schedule_${format(new Date(), "yyyy-MM-dd")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="flex min-h-screen bg-transparent">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                        <p className="text-sm text-slate-500">Overview of today's yard operations.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleExport}>Export Report</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            <Plus className="h-4 w-4" /> New Booking
                        </Button>
                    </div>
                </header>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {metrics.map((metric) => (
                        <Card key={metric.title} className="shadow-sm border-none rounded-xl">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                                    <h3 className="text-3xl font-bold text-slate-900 mt-1">{metric.value}</h3>
                                </div>
                                <div className={`p-3 rounded-full ${metric.bg}`}>
                                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Schedule Table */}
                <Card className="shadow-sm border-none rounded-xl overflow-hidden">
                    <CardHeader className="bg-white border-b px-6 py-5">
                        <CardTitle>Today's Schedule</CardTitle>
                        <CardDescription>Live incoming shipments and carrier statuses.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Loading schedule...</div>
                        ) : bookings.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No active bookings found for today.</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Slot</th>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Carrier</th>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">PO Number</th>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dock</th>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-4 px-6 text-sm text-slate-700 font-medium">
                                                {new Date(booking.start_time.endsWith("Z") ? booking.start_time : booking.start_time + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-900 font-semibold">{booking.carrier_name}</td>
                                            <td className="py-4 px-6 text-sm text-slate-500 font-mono">{booking.po_number}</td>
                                            <td className="py-4 px-6 text-sm text-slate-600">Dock {booking.dock_id}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === "Confirmed" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
