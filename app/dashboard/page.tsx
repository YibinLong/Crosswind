import { DashboardHeader } from "@/components/dashboard-header"
import { WeatherAlerts } from "@/components/weather-alerts"
import { UpcomingFlights } from "@/components/upcoming-flights"
import { QuickStats } from "@/components/quick-stats"
import { RecentActivity } from "@/components/recent-activity"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Stats */}
        <QuickStats />

        {/* Weather Alerts - Most Important */}
        <WeatherAlerts />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <UpcomingFlights />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  )
}
