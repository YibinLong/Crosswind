import { DashboardHeader } from "@/components/dashboard-header"
import { FlightsList } from "@/components/flights-list"
import { ProtectedRoute } from "@/components/protected-route"

export default function FlightsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
        <DashboardHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FlightsList />
        </main>
      </div>
    </ProtectedRoute>
  )
}
