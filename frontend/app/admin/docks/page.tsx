"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Sidebar } from "@/components/Sidebar"
import { Warehouse, Plus, Edit, Trash2, MoreVertical, Snowflake, Box, AlertTriangle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { API_BASE_URL } from "@/lib/config"

interface Dock {
    id: number
    name: string
    capabilities: string[]
    is_active: boolean
    today_booking_count: number
    utilization_percent: number
    next_booking_info: string | null
}

const CAPABILITY_OPTIONS = [
    { id: "General", label: "General Cargo", icon: Box },
    { id: "Cold Storage", label: "Cold Storage", icon: Snowflake },
    { id: "Hazardous", label: "Hazardous Materials", icon: AlertTriangle },
]

export default function DockControlCenter() {
    const router = useRouter()
    const [docks, setDocks] = useState<Dock[]>([])
    const [loading, setLoading] = useState(true)

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editingDock, setEditingDock] = useState<Dock | null>(null)
    const [dockName, setDockName] = useState("")
    const [dockCapabilities, setDockCapabilities] = useState<string[]>([])
    const [dockToDelete, setDockToDelete] = useState<number | null>(null)

    useEffect(() => {
        fetchDocks()
    }, [])

    const fetchDocks = () => {
        fetch(`${API_BASE_URL}/docks/`)
            .then((res) => res.json())
            .then((data) => {
                setDocks(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error("Failed to fetch docks", err)
                setLoading(false)
            })
    }

    const openCreateDialog = () => {
        setEditingDock(null)
        setDockName("")
        setDockCapabilities(["General"]) // Default to General
        setIsDialogOpen(true)
    }

    const openEditDialog = (dock: Dock) => {
        setEditingDock(dock)
        setDockName(dock.name)
        setDockCapabilities(dock.capabilities || [])
        setIsDialogOpen(true)
    }

    const confirmDelete = (dockId: number) => {
        setDockToDelete(dockId)
        setIsDeleteDialogOpen(true)
    }

    const toggleCapability = (capId: string) => {
        setDockCapabilities(prev =>
            prev.includes(capId)
                ? prev.filter(c => c !== capId)
                : [...prev, capId]
        )
    }

    const handleSaveDock = async () => {
        try {
            const method = editingDock ? "PUT" : "POST"
            const url = editingDock
                ? `${API_BASE_URL}/docks/${editingDock.id}`
                : `${API_BASE_URL}/docks/`

            const body = editingDock
                ? { ...editingDock, name: dockName, capabilities: dockCapabilities }
                : { name: dockName, capabilities: dockCapabilities, is_active: true }

            // DEBUG: Alert the URL and Method to verify
            alert(`Sending ${method} to ${url}`)

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.detail || errorData.message || `Server error: ${res.status}`)
            }

            setDockName("")
            setDockCapabilities([])
            setEditingDock(null)
            setIsDialogOpen(false)
            fetchDocks()
        } catch (e: any) {
            console.error(e)
            alert(`Failed to save dock: ${e.message}`)
        }
    }

    const toggleStatus = async (dock: Dock) => {
        try {
            // Optimistic Update
            setDocks(docks.map(d => d.id === dock.id ? { ...d, is_active: !d.is_active } : d))

            await fetch(`${API_BASE_URL}/docks/${dock.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...dock, is_active: !dock.is_active })
            })
            fetchDocks() // Refresh to be safe
        } catch (e) {
            fetchDocks() // Revert on error
            alert("Failed to update status")
        }
    }

    const handleDelete = async () => {
        if (!dockToDelete) return
        try {
            await fetch(`${API_BASE_URL}/docks/${dockToDelete}`, {
                method: "DELETE"
            })
            setIsDeleteDialogOpen(false)
            fetchDocks()
        } catch (e) {
            alert("Failed to delete dock")
        }
    }

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dock Control Center</h1>
                        <p className="text-sm text-slate-500">Manage facility resources and monitor utilization.</p>
                    </div>

                    <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                        <Plus className="h-4 w-4" /> Add New Dock
                    </Button>
                </header>

                {/* Edit/Create Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingDock ? "Edit Dock" : "Add New Dock"}</DialogTitle>
                            <DialogDescription>
                                {editingDock ? "Update dock configuration." : "Create a new dock resource."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input
                                    id="name"
                                    value={dockName}
                                    onChange={(e) => setDockName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="e.g. Dock 5"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4 mt-2">
                                <Label className="text-right pt-2">Capabilities</Label>
                                <div className="col-span-3 space-y-3">
                                    {CAPABILITY_OPTIONS.map((cap) => (
                                        <div key={cap.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`cap-${cap.id}`}
                                                checked={dockCapabilities.includes(cap.id)}
                                                onCheckedChange={() => toggleCapability(cap.id)}
                                            />
                                            <Label
                                                htmlFor={`cap-${cap.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                            >
                                                <cap.icon className="h-4 w-4 text-slate-500" />
                                                {cap.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveDock}>{editingDock ? "Save Changes" : "Create Dock"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this dock? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading dock status...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {docks.map((dock) => (
                            <Card key={dock.id} className="shadow-sm hover:shadow-md transition-shadow border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${dock.is_active ? "bg-indigo-100" : "bg-slate-100"}`}>
                                            <Warehouse className={`h-5 w-5 ${dock.is_active ? "text-indigo-600" : "text-slate-400"}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-slate-900">{dock.name}</CardTitle>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {/* Status Badge */}
                                                <Badge variant={dock.is_active ? "default" : "secondary"} className={dock.is_active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-600"}>
                                                    {dock.is_active ? "Active" : "Maintenance"}
                                                </Badge>

                                                {/* Capability Badges */}
                                                {(dock.capabilities || []).map(cap => {
                                                    const iconObj = CAPABILITY_OPTIONS.find(c => c.id === cap)
                                                    const Icon = iconObj ? iconObj.icon : Box
                                                    return (
                                                        <Badge key={cap} variant="outline" className="text-[10px] px-1 py-0 h-5 gap-1 bg-white">
                                                            <Icon className="h-3 w-3" /> {cap}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => openEditDialog(dock)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Configuration
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(dock.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Dock
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>

                                <CardContent className="space-y-6 pt-4">
                                    {/* Utilization Metric */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Daily Utilization</span>
                                            <span className="text-slate-900 font-bold">{dock.utilization_percent}%</span>
                                        </div>
                                        <Progress value={dock.utilization_percent} className="h-2" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Bookings Today</p>
                                            <p className="text-2xl font-bold text-slate-900">{dock.today_booking_count}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Next Up</p>
                                            <p className="text-sm font-semibold text-indigo-700 truncate" title={dock.next_booking_info || "None"}>
                                                {dock.next_booking_info || "No Schedule"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="border-t bg-slate-50/50 p-4 flex justify-between items-center rounded-b-xl">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id={`dock-mode-${dock.id}`}
                                            checked={dock.is_active}
                                            onCheckedChange={() => toggleStatus(dock)}
                                        />
                                        <Label htmlFor={`dock-mode-${dock.id}`} className="text-xs font-medium text-slate-600 cursor-pointer">
                                            {dock.is_active ? "Online" : "Offline"}
                                        </Label>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-500 hover:text-indigo-600 h-8 text-xs"
                                        onClick={() => router.push("/admin/schedule")}
                                    >
                                        View Schedule
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
