"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"

// ... existing imports ...

// Inside component
const startDateTime = new Date(`${selectedDate}T${selectedTime}`)
// Add 60 minutes for end time
const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

// Send as Local ISO string (No 'Z') so backend treats it as "Wall Clock Time"
// This fixes the 4-hour timezone offset issue where 9am becomes 5am
const payload = {
    dock_id: availableDock.id,
    po_number: poNumber,
    odoo_order_id: odooOrderId,
    carrier_name: `${carrierName || "Independent"} (${vehicleType})`,
    start_time: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
    end_time: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
    driver_phone: contactPhone || "N/A"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Truck, Calendar, Clock, User, Phone, ArrowLeft, ArrowRight, Car, Container, Info, Check, Snowflake, Box, AlertTriangle, Warehouse } from "lucide-react"
import QRCode from "react-qr-code"
import { API_BASE_URL } from "@/lib/config"

interface Dock {
        id: number
    name: string
    capabilities: string[]
    is_active: boolean
    }

// Load Types Map
const LOAD_TYPES = [
    { id: "General", label: "General Cargo", icon: Box, description: "Standard dry goods, pallets, boxes." },
    { id: "Cold Storage", label: "Cold Storage", icon: Snowflake, description: "Refrigerated goods, produce, frozen." },
    { id: "Hazardous", label: "Hazardous Materials", icon: AlertTriangle, description: "Chemicals, flammable items." },
]

const VEHICLES = [
    { id: "Van", label: "Van / LCV", icon: Car },
    { id: "Truck", label: "Box Truck", icon: Truck },
    { id: "Trailer", label: "Semi / Trailer", icon: Container },
]

export default function BookingWizard() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [bookingRef, setBookingRef] = useState("")

    // Data
    const [docks, setDocks] = useState<Dock[]>([])
    // We no longer select a specific dock manually. 
    // We select a load type, which filters the capable docks.
    const [selectedLoadType, setSelectedLoadType] = useState("")

    // bookings for the selected date across ALL docks
    const [allBookings, setAllBookings] = useState<any[]>([])

    // Form Fields
    const [poNumber, setPoNumber] = useState("")
    const [isVerifyingPO, setIsVerifyingPO] = useState(false)
    const [odooOrderId, setOdooOrderId] = useState<number | null>(null)
    const [supplierName, setSupplierName] = useState("")

    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    const [carrierName, setCarrierName] = useState("")
    const [vehicleType, setVehicleType] = useState<string>("Truck")
    const [contactPhone, setContactPhone] = useState("")

    // Final assigned dock for the booking
    const [assignedDockId, setAssignedDockId] = useState<number | null>(null)

    const verifyPO = async () => {
        if (!poNumber) return
        setIsVerifyingPO(true)
        setMessage("")
        setOdooOrderId(null)
        setSupplierName("")

        try {
            const res = await fetch(`${API_BASE_URL}/bookings/validate-po?po=${poNumber}`)
            if (!res.ok) {
                throw new Error("PO not found or invalid.")
            }
            const data = await res.json()
            if (data.valid) {
                setOdooOrderId(data.id)
                setSupplierName(data.partner)
            } else {
                throw new Error("Invalid PO.")
            }
        } catch (e) {
            setMessage("PO not found in Odoo. Please contact logistics.")
            setOdooOrderId(null)
        } finally {
            setIsVerifyingPO(false)
        }
    }

    // Fetch Docks on Mount
    useEffect(() => {
        const fetchDocks = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/docks/`)
                if (!res.ok) throw new Error("Failed to load docks")
                const data = await res.json()
                setDocks(data.filter((d: Dock) => d.is_active))
            } catch (e) {
                setMessage(`Could not load available docks. (Backend: ${API_BASE_URL})`)
            }
        }
        fetchDocks()
    }, [])

    // Fetch All Bookings when Date changes
    useEffect(() => {
        if (selectedDate) {
            fetchAllBookings(selectedDate)
        }
    }, [selectedDate])

    const fetchAllBookings = async (date: string) => {
        try {
            // We fetch bookings for ALL docks for this date to determine availability client-side
            // In a real large-scale app, this filtering would happen on the backend.
            const res = await fetch(`${API_BASE_URL}/bookings/?date=${date}`)
            if (res.ok) {
                const data = await res.json()
                setAllBookings(data)
            }
        } catch (e) {
            console.error("Failed to fetch bookings")
        }
    }

    // Smart availability check
    const isTimeSlotAvailable = (time: string): boolean => {
        if (!selectedLoadType) return false

        // 1. Find all docks that can handle this load type
        const capableDocks = docks.filter(d => (d.capabilities || []).includes(selectedLoadType))
        if (capableDocks.length === 0) return false

        // 2. Check if passed (standard check)
        if (selectedDate) {
            const todayStr = new Date().toLocaleDateString('en-CA')
            if (selectedDate === todayStr) {
                const now = new Date()
                const [slotHour, slotMinute] = time.split(':').map(Number)
                const slotDate = new Date()
                slotDate.setHours(slotHour, slotMinute, 0, 0)
                if (now > slotDate) return false
            }
        }

        // 3. Check if AT LEAST ONE capable dock is free at this time
        // A dock is free if it doesn't have a booking at this time
        const freeDocks = capableDocks.filter(dock => {
            const bookingAtTime = allBookings.find(b => {
                if (b.dock_id !== dock.id) return false
                const d = new Date(b.start_time)
                const bookingTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                return bookingTime === time
            })
            return !bookingAtTime // True if no booking found
        })

        return freeDocks.length > 0
    }

    const handleNext = () => {
        if (step === 1) {
            if (!poNumber) {
                setMessage("Please enter a PO Number")
                return
            }
            if (!odooOrderId) {
                setMessage("Please verify the PO Number before proceeding.")
                return
            }
        }
        if (step === 2 && !selectedLoadType) {
            setMessage("Please select a load type.")
            return
        }
        if (step === 3 && (!selectedDate || !selectedTime)) {
            setMessage("Please select a date and time.")
            return
        }

        // If moving from Step 3 -> 4, we must ASSIGN a dock now (or at least conceptually)
        // We'll actually do the final assignment in handleSubmit to prevent race conditions, 
        // but for display we can verify we have one.

        setMessage("")
        setStep(step + 1)
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const handleSubmit = async () => {
        setLoading(true)
        setMessage("")

        // 1. Re-calculate the best dock (Smart Assign)
        // We do this right before submit to ensure we pick a valid one.
        const capableDocks = docks.filter(d => (d.capabilities || []).includes(selectedLoadType))

        // Find the first dock that is free at the selected time
        const availableDock = capableDocks.find(dock => {
            const bookingAtTime = allBookings.find(b => {
                if (b.dock_id !== dock.id) return false
                const d = new Date(b.start_time)
                const bookingTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                return bookingTime === selectedTime
            })
            return !bookingAtTime
        })

        if (!availableDock) {
            setMessage("Error: This slot was just taken. Please choose another.")
            setLoading(false)
            return
        }

        setAssignedDockId(availableDock.id)

        const startDateTime = new Date(`${selectedDate}T${selectedTime}`)
        // Add 60 minutes for end time
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

        const payload = {
            dock_id: availableDock.id,
            po_number: poNumber,
            odoo_order_id: odooOrderId,
            carrier_name: `${carrierName || "Independent"} (${vehicleType})`, // Combine vehicle type since backend doesn't have a field for it yet
            start_time: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
            end_time: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
            driver_phone: contactPhone || "N/A"
        }

        try {
            const res = await fetch(`${API_BASE_URL}/bookings/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const err = await res.json()
                console.error("Booking Error Details:", err)
                // Pydantic returns Validation Error as detail: [{loc, msg, type}]
                const errorMessage = Array.isArray(err.detail)
                    ? err.detail.map((e: any) => `${e.loc[1]}: ${e.msg}`).join(" | ")
                    : err.detail || "Booking failed"
                throw new Error(errorMessage)
            }

            const booking = await res.json()
            setBookingRef(`BK-${booking.id}`)
            setStep(5)
        } catch (error: any) {
            setMessage(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const timeSlots = [
        "08:00", "09:00", "10:00", "11:00",
        "12:00", "13:00", "14:00", "15:00", "16:00"
    ]

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-transparent">

            {/* Left Column (Info Sidebar) */}
            <div className="w-full md:w-[40%] bg-indigo-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-6 left-6 z-10">
                    <Link href="/">
                        <Button variant="ghost" className="text-indigo-200 hover:text-white hover:bg-indigo-800 gap-2 pl-0">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                    </Link>
                </div>

                <div className="mt-16 relative z-10">
                    <div className="h-16 w-16 bg-indigo-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/50">
                        <Truck className="h-8 w-8 text-indigo-300" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Driver Self-Service Portal</h1>
                    <p className="text-indigo-200 text-lg mb-8">Smart Scheduling System</p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-800 p-1 rounded-full"><Check className="h-4 w-4 text-green-400" /></div>
                            <span className="text-indigo-100">Select Load Type</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-800 p-1 rounded-full"><Check className="h-4 w-4 text-green-400" /></div>
                            <span className="text-indigo-100">Browse Available Slots</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-800 p-1 rounded-full"><Check className="h-4 w-4 text-green-400" /></div>
                            <span className="text-indigo-100">Instant Dock Assignment</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-sm text-indigo-300 relative z-10">
                    <p className="font-semibold mb-1">Need Help?</p>
                    <p>Contact Dispatch: +1 (555) 012-3456</p>
                </div>

                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
            </div>

            {/* Right Column (Form Area) */}
            <div className="w-full md:w-[60%] p-6 md:p-12 flex flex-col justify-center items-center bg-white">
                <div className="w-full max-w-md">

                    <div className="mb-8 text-center md:text-left">

                        {step < 5 && (
                            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                                <div className={`h-2 w-2 rounded-full ${step >= 1 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                                <div className={`h-1 w-6 rounded-full ${step >= 2 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                                <div className={`h-2 w-2 rounded-full ${step >= 2 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                                <div className={`h-1 w-6 rounded-full ${step >= 3 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                                <div className={`h-2 w-2 rounded-full ${step >= 3 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                                <div className={`h-1 w-6 rounded-full ${step >= 4 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                                <div className={`h-2 w-2 rounded-full ${step >= 4 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                                <span className="ml-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Step {step} of 4
                                </span>
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <Info className="h-4 w-4" /> {message}
                        </div>
                    )}

                    {/* Step 1: PO & Vehicle */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                                <Label className="text-base font-semibold text-slate-700">Purchase Order (PO)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={poNumber}
                                        onChange={(e) => {
                                            setPoNumber(e.target.value)
                                            setOdooOrderId(null) // Reset verification on change
                                            setSupplierName("")
                                        }}
                                        placeholder="PO-123456"
                                        className={`h-12 text-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 ${odooOrderId ? "border-green-500 ring-green-500" : ""}`}
                                    />
                                    <Button
                                        onClick={verifyPO}
                                        disabled={isVerifyingPO || !poNumber.trim() || odooOrderId !== null}
                                        className={`h-12 px-6 ${odooOrderId ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                                    >
                                        {isVerifyingPO ? "Verifying..." : odooOrderId ? "Verified" : "Verify"}
                                    </Button>
                                </div>

                                {odooOrderId && (
                                    <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" /> Supplier: {supplierName}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base font-semibold text-slate-700">Select Vehicle Type</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {VEHICLES.map((v) => {
                                        const Icon = v.icon
                                        const isSelected = vehicleType === v.id
                                        return (
                                            <div
                                                key={v.id}
                                                onClick={() => setVehicleType(v.id)}
                                                className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:border-indigo-200 hover:bg-slate-50 ${isSelected
                                                    ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                                                    : "border-slate-100 bg-white"
                                                    }`}
                                            >
                                                <Icon className={`h-8 w-8 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                                                <span className={`text-sm font-medium ${isSelected ? "text-indigo-900" : "text-slate-600"}`}>
                                                    {v.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Load Type (Smart Filter) */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Label className="text-base font-semibold text-slate-700">Select Load Type</Label>
                            <div className="grid grid-cols-1 gap-4">
                                {LOAD_TYPES.map((type) => {
                                    const Icon = type.icon
                                    return (
                                        <div
                                            key={type.id}
                                            onClick={() => setSelectedLoadType(type.id)}
                                            className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center gap-4
                                                ${selectedLoadType === type.id
                                                    ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                                                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                                }
                                            `}
                                        >
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center 
                                                ${selectedLoadType === type.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}
                                            `}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{type.label}</h3>
                                                <p className="text-xs text-slate-500">{type.description}</p>
                                            </div>
                                            {selectedLoadType === type.id && (
                                                <CheckCircle2 className="ml-auto h-5 w-5 text-indigo-600" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Date & Smart Time Slots */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                                <Label className="text-base font-semibold text-slate-700">Appointment Date</Label>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="h-12 border-slate-200"
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base font-semibold text-slate-700">Available Time Slots</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {timeSlots.map((time) => {
                                        const available = isTimeSlotAvailable(time)
                                        return (
                                            <Button
                                                key={time}
                                                variant={selectedTime === time ? "default" : "outline"}
                                                onClick={() => available && setSelectedTime(time)}
                                                disabled={!available}
                                                className={`h-12 ${selectedTime === time
                                                    ? "bg-indigo-600 hover:bg-indigo-700"
                                                    : !available
                                                        ? "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-100"
                                                        : "border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                                    }`}
                                            >
                                                {time}
                                            </Button>
                                        )
                                    })}
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                                    <Info className="h-3 w-3" /> Slots shown are for {selectedLoadType} capable docks.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Details */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label>Carrier Company</Label>
                                    <Input
                                        value={carrierName}
                                        onChange={(e) => setCarrierName(e.target.value)}
                                        placeholder="FastFreight Logistics"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vehicle Type</Label>
                                    <Input
                                        value={vehicleType}
                                        onChange={(e) => setVehicleType(e.target.value)}
                                        placeholder="53' Trailer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Driver Phone</Label>
                                    <Input
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && (
                        <div className="text-center animate-in zoom-in-50 duration-500">
                            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                            <p className="text-slate-500 mb-8 max-w-xs mx-auto">Your appointment has been scheduled. You will receive a confirmation shortly.</p>

                            <div className="flex justify-center mb-8">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <QRCode value={bookingRef} size={120} />
                                </div>
                            </div>

                            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8">
                                <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold mb-2">Reference Code</p>
                                <p className="text-3xl font-mono font-bold text-indigo-900 tracking-wider">{bookingRef}</p>
                            </div>

                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="w-full"
                            >
                                Book Another Shipment
                            </Button>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {step < 5 && (
                        <div className="flex gap-4 mt-8 pt-8 border-t border-slate-100">
                            {step > 1 && (
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="w-1/3"
                                >
                                    Back
                                </Button>
                            )}
                            <Button
                                className={`${step === 1 ? "w-full" : "w-2/3"} bg-indigo-600 hover:bg-indigo-700 text-lg h-12`}
                                onClick={step === 4 ? handleSubmit : handleNext}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : step === 4 ? "Confirm Booking" : "Continue"}
                                {!loading && step < 4 && <ArrowRight className="ml-2 h-5 w-5" />}
                            </Button>
                        </div>
                    )}

                </div>
            </div>

        </div>
    )
}
