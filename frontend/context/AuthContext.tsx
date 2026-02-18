"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Driver {
    id: number;
    phone: string;
    name: string;
    created_at: string;
}

interface AuthContextType {
    driver: Driver | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [driver, setDriver] = useState<Driver | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Load token from local storage on mount
        const storedToken = localStorage.getItem("driver_token");
        if (storedToken) {
            setToken(storedToken);
            fetchDriver(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchDriver = async (token: string) => {
        try {
            // Adjust API URL as needed. Assuming backend is on same domain or proxied, 
            // or absolute URL if separated. For now using relative /docs/.. style or absolute if env var.
            // But usually nextjs is on 3000 and fastapi on 8000.
            // Let's assume standard localhost:8000 for dev if not proxied.
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            const response = await fetch(`${apiUrl}/auth/driver/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDriver(data);
            } else {
                logout();
            }
        } catch (error) {
            console.error("Failed to fetch driver", error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = (token: string) => {
        localStorage.setItem("driver_token", token);
        setToken(token);
        fetchDriver(token);
    };

    const logout = () => {
        localStorage.removeItem("driver_token");
        setToken(null);
        setDriver(null);
        router.push("/driver/login");
    };

    return (
        <AuthContext.Provider value={{ driver, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
