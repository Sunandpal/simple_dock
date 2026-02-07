export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Header Removed */}
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                {children}
            </main>
        </div>
    )
}
