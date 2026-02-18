import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "SimpleDock",
    description: "B2B Dock Scheduling System",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn("min-h-screen bg-transparent font-sans antialiased", inter.variable)}>
                <div className="fixed inset-0 -z-50 bg-gradient-aurora opacity-60 pointer-events-none" />
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
