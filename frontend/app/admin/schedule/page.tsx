"use client"

import { useState, useEffect } from "react"
import { format, addDays, startOfToday, parseISO, isSameDay } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Sidebar } from "@/components/Sidebar"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Truck, User, Phone, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
// DnD Imports
import { DndContext, useDraggable, useDroppable, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { API_BASE_URL } from "@/lib/config"

// Types
interface Dock {
    id: number
    name: string
    capabilities: string[]
    is_active: boolean
}

interface Booking {
    id: number
    dock_id: number
    start_time: string
    end_time: string
    carrier_name: string
    po_number: string
    odoo_order_id?: number
    driver_phone: string
    status: "Pending" | "Confirmed" | "Arrived" | "Completed" | "Cancelled" | "Late" | "Rescheduled"
}

// Draggable Booking Component
const DraggableBooking = ({ booking, style, onClick }: { booking: Booking, style: React.CSSProperties, onClick: () => void }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `booking-${booking.id}`,
        data: { booking }
    })

    const dndStyle = {
        ...style,
        transform: CSS.Translate.toString(transform),
        zIndex: transform ? 50 : 10,
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Arrived": return "bg-green-100 border-green-500 text-green-700"
            case "Completed": return "bg-slate-100 border-slate-300 text-slate-500"
            case "Late": return "bg-red-100 border-red-500 text-red-700"
            case "Rescheduled": return "bg-orange-100 border-orange-500 text-orange-700"
            case "Confirmed":
            default: return "bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200"
        }
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                "absolute top-2 bottom-2 rounded-md border-l-4 p-2 cursor-pointer shadow-sm transition-all hover:brightness-95 hover:shadow-md flex flex-col justify-center overflow-hidden",
                getStatusColor(booking.status || "Confirmed")
            )}
            style={dndStyle}
        >
            <div className="font-bold text-xs truncate">{booking.carrier_name}</div>
            <div className="text-[10px] opacity-80 truncate">{booking.po_number}</div>
        </div>
    )
}

// Droppable Dock Row
const DroppableDockRow = ({ dock, children }: { dock: Dock, children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({
        id: `dock-${dock.id}`,
        data: { dockId: dock.id }
    })

    return (
        <div ref={setNodeRef} className="flex-1 relative h-24 bg-grid-pattern">
            {children}
        </div>
    )
}


export default function SchedulePage() {
    const [date, setDate] = useState<Date>(startOfToday())
    const [docks, setDocks] = useState<Dock[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState("")
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [editDate, setEditDate] = useState<Date | undefined>(undefined)
    const [editTime, setEditTime] = useState<string>("")
    const [filterCapability, setFilterCapability] = useState<string>("All")

    // Time Constants (06:00 to 22:00)
    const START_HOUR = 6
    const END_HOUR = 22
    const TOTAL_HOURS = END_HOUR - START_HOUR
    const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)

    // DnD Sensors - allow click through by requiring 8px movement for drag
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    useEffect(() => {
        fetchData()
    }, [date])

    const fetchData = async () => {
        setLoading(true)
        setErrorMsg("")
        try {
            const dateStr = format(date, 'yyyy-MM-dd')

            // 1. Fetch Docks
            const dockRes = await fetch(`${API_BASE_URL}/docks/`)
            if (!dockRes.ok) throw new Error("Failed to fetch docks")
            const dockData = await dockRes.json()
            setDocks(dockData)

            // 2. Fetch Bookings
            const bookingRes = await fetch(`${API_BASE_URL}/bookings/?date=${dateStr}`)
            if (!bookingRes.ok) throw new Error("Failed to fetch bookings")
            const bookingData = await bookingRes.json()
            setBookings(bookingData)
        } catch (error: any) {
            console.error("Failed to load schedule data", error)
            setErrorMsg(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Filter Docks
    const filteredDocks = filterCapability === "All"
        ? docks
        : docks.filter(d => d.capabilities.includes(filterCapability))

    // Helper: Position calculation
    const getBookingStyle = (booking: Booking) => {
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)

        const startHour = start.getHours() + (start.getMinutes() / 60)
        const endHour = end.getHours() + (end.getMinutes() / 60)

        // Prevent rendering if out of bounds (shouldn't happen with filtering but safe to check)
        if (startHour < START_HOUR || endHour > END_HOUR) return { display: 'none' }

        // Grid Column Calculation
        // Grid starts at column 2 (column 1 is dock name)
        // Each hour is 1 column (or we can use fractional units)
        // Let's use 60px per hour width methodology or relative %

        // Using Percentages for absolute positioning within the row
        const left = ((startHour - START_HOUR) / TOTAL_HOURS) * 100
        const width = ((endHour - startHour) / TOTAL_HOURS) * 100

        return {
            left: `${left}%`,
            width: `${width}%`
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Arrived": return "bg-green-100 border-green-500 text-green-700"
            case "Completed": return "bg-slate-100 border-slate-300 text-slate-500"
            case "Late": return "bg-red-100 border-red-500 text-red-700"
            case "Rescheduled": return "bg-orange-100 border-orange-500 text-orange-700"
            case "Confirmed":
            default: return "bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200"
        }
    }

    const handleBookingClick = (booking: Booking) => {
        setSelectedBooking(booking)
        setEditDate(parseISO(booking.start_time))
        setEditTime(format(parseISO(booking.start_time), "HH:mm"))
        setIsSheetOpen(true)
    }

    const handleManualReschedule = async () => {
        if (!selectedBooking || !editDate || !editTime) return

        try {
            const [hours, minutes] = editTime.split(':').map(Number)
            const newStart = new Date(editDate)
            newStart.setHours(hours, minutes, 0, 0)
            const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000) // Default 1 hour duration

            // Check for Date Change & Status Update
            const isDateChange = !isSameDay(parseISO(selectedBooking.start_time), newStart)
            const newStatus = (selectedBooking.status === 'Late' && isDateChange) ? 'Rescheduled' : selectedBooking.status

            const res = await fetch(`${API_BASE_URL}/bookings/${selectedBooking.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_time: newStart.toISOString(),
                    end_time: newEnd.toISOString(),
                    status: newStatus
                })
            })

            if (!res.ok) throw new Error("Failed to reschedule")

            setIsSheetOpen(false)
            fetchData()
        } catch (error) {
            console.error("Reschedule failed", error)
        }
    }

    const updateStatus = async (status: string) => {
        if (!selectedBooking) return
        try {
            // Optimistic update
            setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: status as any } : b))
            setSelectedBooking(prev => prev ? { ...prev, status: status as any } : null)

            // Real Backend Call
            const res = await fetch(`${API_BASE_URL}/bookings/${selectedBooking.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            })

            if (!res.ok) {
                const err = await res.json()
                console.error("Failed to update status on server:", err)
                // Revert optimistic update if failed
                fetchData()
            }

        } catch (e) {
            console.error("Failed to update status", e)
            fetchData()
        }
    }

    // Drag End Handler
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over, delta } = event

        if (!over) {
            console.log("Dropped outside")
            return
        }

        const bookingId = parseInt(active.id.toString().replace("booking-", ""))
        const newDockId = parseInt(over.id.toString().replace("dock-", "")) // Dropped on a Dock Row
        const booking = bookings.find(b => b.id === bookingId)

        if (!booking) return

        // Calculate Time Shift
        // Timeline Width (in % or px) is hard to know exactly in raw delta.x without ref.
        // But we roughly know 100% = TOTAL_HOURS.
        // We can approximate by assuming the container width. 
        // For a more robust solution, we'd measure the row width.
        // Let's assume a standard full-width container on 1080p is ~800px-1200px.
        // Better: Just use a fixed "pixels per hour" constant if the grid was pixels.
        // BUT, since we use %, we need converting pixels (delta.x) to hours.
        // Hack: Use `window.innerWidth` or a ref to the container.

        // Let's grab the timeline container width safely
        const timelineWidth = document.getElementById("timeline-container")?.offsetWidth || 1000
        const pixelsPerHour = timelineWidth / TOTAL_HOURS
        const hoursShift = delta.x / pixelsPerHour

        // Round to nearest 30 mins (0.5)
        const roundedHoursShift = Math.round(hoursShift * 2) / 2

        if (roundedHoursShift === 0 && newDockId === booking.dock_id) return // No change

        console.log(`Moving Booking ${bookingId}: Shift ${roundedHoursShift}h, New Dock ${newDockId}`)

        // Calculate New Times
        const originalStart = new Date(booking.start_time)
        const originalEnd = new Date(booking.end_time)

        // Add milliseconds
        const shiftMs = roundedHoursShift * 60 * 60 * 1000
        const newStart = new Date(originalStart.getTime() + shiftMs)
        const newEnd = new Date(originalEnd.getTime() + shiftMs)

        // Check for Date Change (Drag across midnight? Unlikely given simple view but possible conceptually)
        // Note: DnD is currently same-day only essentially as it shifts hours within line.
        // But if we allow dragging to calendar/other weeks later...
        // For now, simple horizontal drag won't change date unless we add features.
        // HOWEVER, user specifically asked: "once a late delivery is moved to another date".
        // The current DnD is horizontal (Time) and Vertical (Dock), NOT Date.
        // BUT, if the shift pushes it past midnight?
        // The current logic: newStart = originalStart + shiftMs.
        const isDateChange = !isSameDay(originalStart, newStart)
        const newStatus = (booking.status === 'Late' && isDateChange) ? 'Rescheduled' : booking.status

        // Optimistic Update
        const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, dock_id: newDockId, start_time: newStart.toISOString(), end_time: newEnd.toISOString(), status: newStatus as any } : b)
        setBookings(updatedBookings)

        // Backend Update
        try {
            await fetch(`http://localhost:8000/bookings/${bookingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dock_id: newDockId,
                    start_time: newStart.toISOString(),
                    end_time: newEnd.toISOString(),
                    status: newStatus
                })
            })
            // Refresh to snap to grid exactly if creating overlaps etc
            // setTimeout(() => fetchData(), 500)
        } catch (e) {
            console.error("Failed to move booking", e)
            fetchData() // Revert
        }
    }

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex h-screen bg-slate-50 overflow-hidden">
                <Sidebar />

                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header Toolbar */}
                    <header className="bg-white border-b px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Dock Schedule</h1>
                            <p className="text-slate-500 text-sm">Visual timeline management</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Dock Filter */}
                            <Select value={filterCapability} onValueChange={setFilterCapability}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter Docks" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Docks</SelectItem>
                                    <SelectItem value="General">General Cargo</SelectItem>
                                    <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                                    <SelectItem value="Hazardous">Hazardous</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date Picker */}
                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, -1))}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <input
                                    type="date"
                                    className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer h-9 w-[140px] text-center"
                                    value={format(date, "yyyy-MM-dd")}
                                    onChange={(e) => setDate(e.target.value ? new Date(e.target.value + "T00:00:00") : new Date())}
                                />
                                <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </header>

                    {/* Gantt Chart Area */}
                    <div className="flex-1 overflow-auto p-6">
                        <div id="timeline-container" className="bg-white rounded-xl shadow-sm border border-slate-200 min-w-[800px]">

                            {/* Timeline Header (Hours) */}
                            <div className="flex border-b border-slate-200">
                                <div className="w-32 flex-shrink-0 p-4 border-r bg-slate-50 font-semibold text-slate-500 text-sm">
                                    Dock / Time
                                </div>
                                <div className="flex-1 flex relative h-12">
                                    {HOURS.map(hour => (
                                        <div key={hour} className="flex-1 border-r border-slate-100 text-xs text-slate-400 p-2 text-center">
                                            {hour}:00
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Loading State */}
                            {loading && (
                                <div className="p-12 text-center text-slate-500">Loading schedule...</div>
                            )}

                            {/* Docks Rows */}
                            {!loading && filteredDocks.map(dock => (
                                <div key={dock.id} className="flex border-b border-slate-200 group hover:bg-slate-50 transition-colors">
                                    {/* Dock Name Column */}
                                    <div className="w-32 flex-shrink-0 p-4 border-r border-slate-200 flex flex-col justify-center">
                                        <div className="font-semibold text-slate-700">{dock.name}</div>
                                        <div className="flex gap-1 flex-wrap mt-1">
                                            {(dock.capabilities || []).map(cap => (
                                                <span key={cap} className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200">
                                                    {cap.slice(0, 4)}..
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Timeline Row (Droppable) */}
                                    <DroppableDockRow dock={dock}>
                                        {/* Grid Lines Overlay */}
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            {HOURS.map(hour => (
                                                <div key={hour} className="flex-1 border-r border-slate-100/50"></div>
                                            ))}
                                        </div>

                                        {/* Booking Blocks (Draggable) */}
                                        {bookings
                                            .filter(b => b.dock_id === dock.id)
                                            .map(booking => {
                                                const style = getBookingStyle(booking)
                                                return (
                                                    <DraggableBooking
                                                        key={booking.id}
                                                        booking={booking}
                                                        style={style}
                                                        onClick={() => handleBookingClick(booking)}
                                                    />
                                                )
                                            })
                                        }
                                    </DroppableDockRow>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Booking Detail Sheet */}
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetContent className="w-[400px] sm:w-[540px]">
                            <SheetHeader>
                                <SheetTitle className="text-xl">Booking Details</SheetTitle>
                                <SheetDescription>
                                    Manage status and view information for {selectedBooking?.po_number}
                                </SheetDescription>
                            </SheetHeader>

                            {selectedBooking && (
                                <div className="py-6 space-y-6">
                                    {/* Status Banner */}
                                    <div className={cn(
                                        "p-4 rounded-lg border flex items-center gap-3",
                                        getStatusColor(selectedBooking.status || "Confirmed").replace("hover:bg-blue-200", "")
                                    )}>
                                        <div className="bg-white/50 p-2 rounded-full">
                                            {selectedBooking.status === 'Arrived' ? <CheckCircle2 className="h-5 w-5" /> :
                                                selectedBooking.status === 'Late' ? <AlertCircle className="h-5 w-5" /> :
                                                    <Clock className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">{selectedBooking.status || "Confirmed"}</p>
                                            <p className="text-sm opacity-90">Current Status</p>
                                        </div>
                                    </div>

                                    {/* Odoo Validation Section */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div>
                                            <span className="text-xs text-slate-500 font-medium uppercase">Purchase Order</span>
                                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                {selectedBooking.po_number}
                                                {selectedBooking.odoo_order_id && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                            </div>
                                        </div>
                                        {selectedBooking.odoo_order_id && (
                                            <Button size="sm" variant="outline" className="gap-2" asChild>
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_ODOO_URL || 'https://odoo.com'}/web#id=${selectedBooking.odoo_order_id}&model=purchase.order&view_type=form`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    View in Odoo <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-xs text-slate-500 font-medium uppercase">Carrier</span>
                                                <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                    <Truck className="h-4 w-4 text-slate-400" />
                                                    {selectedBooking.carrier_name}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-slate-500 font-medium uppercase">Time</span>
                                                <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    {format(parseISO(selectedBooking.start_time), "HH:mm")} - {format(parseISO(selectedBooking.end_time), "HH:mm")}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1 pt-2">
                                            <span className="text-xs text-slate-500 font-medium uppercase">Driver Info</span>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-slate-700"><User className="h-4 w-4" /> Driver Phone</span>
                                                    <span className="font-mono">{selectedBooking.driver_phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reschedule Section */}
                                    <div className="space-y-3 pt-4 border-t">
                                        <h4 className="text-sm font-medium text-slate-900">Reschedule</h4>
                                        <div className="flex gap-3">
                                            {/* Date Picker */}
                                            <div className="grid gap-2 w-full">
                                                <div className="text-sm font-medium">Select New Date</div>
                                                <input
                                                    type="date"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={editDate ? editDate.toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setEditDate(e.target.value ? new Date(e.target.value) : undefined)}
                                                />
                                            </div>

                                            {/* Time Select */}
                                            <div className="grid gap-2 w-[120px]">
                                                <div className="text-sm font-medium">Time</div>
                                                <Select value={editTime} onValueChange={setEditTime}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Time" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {HOURS.map(hour => (
                                                            <SelectItem key={hour} value={`${hour}:00`}>
                                                                {hour}:00
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button onClick={handleManualReschedule} className="w-full" variant="secondary">
                                            Update Schedule
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => { updateStatus("Arrived"); setIsSheetOpen(false) }}
                                        >
                                            Check-In Driver
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="border-slate-300"
                                            onClick={() => { updateStatus("Completed"); setIsSheetOpen(false) }}
                                        >
                                            Complete Job
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="w-full col-span-2"
                                            onClick={() => { updateStatus("Late"); setIsSheetOpen(false) }}
                                        >
                                            Mark as Late
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                </main>
            </div>
        </DndContext >
    )
}
