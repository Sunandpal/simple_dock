"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Truck } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

export default function BookingForm({ params }: { params: { dockId: string } }) {
    const [step, setStep] = useState(1)
    const [date, setDate] = useState("")
    const [time, setTime] = useState("")
    const [carrier, setCarrier] = useState("")
    const [poNumber, setPoNumber] = useState("PO-")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [bookingRef, setBookingRef] = useState("")
    const router = useRouter()

    const handleNext = () => {
        if (step === 1) {
            if (!carrier || !poNumber.startsWith("PO-")) {
                alert("Please enter a valid Carrier Name and PO Number (starting with PO-)")
                return
            }
            setStep(2)
        } else if (step === 2) {
            if (!date || !time) {
                alert("Please select a Date and Time")
                return
            }
            setStep(3)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        setMessage("")

        // Force UTC for consistency
        const startDateTime = new Date(`${date}T${time}:00Z`)
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

        try {
            const res = await fetch(`${API_BASE_URL}/bookings/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dock_id: parseInt(params.dockId),
                    start_time: startDateTime.toISOString(), // This will be accurate UTC
                    end_time: endDateTime.toISOString(),
                    carrier_name: carrier,
                    po_number: poNumber
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || "Booking failed")
            }

            const booking = await res.json()
            setBookingRef(`BK-${booking.id}`)
            setStep(4) // Success Step
        } catch (error: any) {
            setMessage(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">SimpleDock</h2>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">Doc {params.dockId}</span>
                    </div>
                    <CardTitle>
                        {step === 1 && "Identity Verification"}
                        {step === 2 && "Select Slot"}
                        {step === 3 && "Confirm Booking"}
                        {step === 4 && "Booking Confirmed"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Please provide your carrier details and PO number."}
                        {step === 2 && "Choose your preferred delivery window."}
                        {step === 3 && "Review the details before confirming."}
                        {step === 4 && "Your slot has been secured."}
                    </CardDescription>

                    {/* Stepper Indicator */}
                    {step < 4 && (
                        <div className="flex items-center gap-2 mt-4">
                            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-slate-200"}`} />
                            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-slate-200"}`} />
                            <div className={`h-2 flex-1 rounded-full ${step >= 3 ? "bg-primary" : "bg-slate-200"}`} />
                        </div>
                    )}
                </CardHeader>

                <CardContent>
                    {message && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">
                            {message}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="carrier">Carrier Name</Label>
                                <div className="relative">
                                    <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="carrier"
                                        placeholder="e.g. FedEx, DHL, Private Fleet"
                                        className="pl-9"
                                        value={carrier}
                                        onChange={(e) => setCarrier(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="po">Purchase Order (PO) Number</Label>
                                <Input
                                    id="po"
                                    placeholder="PO-XXXX"
                                    value={poNumber}
                                    onChange={(e) => setPoNumber(e.target.value)}
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Must start with "PO-" for validation.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="time"
                                        type="time"
                                        className="pl-9"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Standard duration is 60 minutes.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Carrier</span>
                                <span className="font-medium">{carrier}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">PO Number</span>
                                <span className="font-medium">{poNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Slot</span>
                                <span className="font-medium">{date} @ {time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Duration</span>
                                <span className="font-medium">60 Minutes</span>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-6">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-medium">Booking Successful</h3>
                                <p className="text-sm text-gray-500 mt-1">Reference: <span className="font-mono text-black">{bookingRef}</span></p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between">
                    {step < 4 && (
                        <>
                            {step > 1 ? (
                                <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
                            ) : (
                                <div /> // Spacer
                            )}

                            {step < 3 ? (
                                <Button onClick={handleNext}>Next Step</Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Confirming..." : "Confirm Booking"}
                                </Button>
                            )}
                        </>
                    )}
                    {step === 4 && (
                        <Button className="w-full" onClick={() => window.location.reload()}>Book Another</Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
