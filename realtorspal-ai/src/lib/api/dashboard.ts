// src/lib/api/dashboard.ts
import { axios } from "@/lib/axios"

export async function fetchDashboardMetrics() {
  const response = await axios.get("/dashboard/metrics")
  return response.data
}

