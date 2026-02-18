"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DriverDashboardPage() {
    const { driver, isLoading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !driver) {
            router.push("/driver/login");
        }
    }, [isLoading, driver, router]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!driver) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="min-h-screen p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Driver Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {driver.name}</p>
                </div>
                <Button variant="outline" onClick={logout}>
                    Logout
                </Button>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>My Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">You have no upcoming bookings.</p>
                        {/* Placeholder for bookings list */}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="font-semibold">Phone:</span> {driver.phone}
                        </div>
                        <div>
                            <span className="font-semibold">Member Since:</span> {new Date(driver.created_at).toLocaleDateString()}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
