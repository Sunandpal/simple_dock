let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
if (!apiUrl.startsWith("http")) {
    apiUrl = `https://${apiUrl}`
}
export const API_BASE_URL = apiUrl
