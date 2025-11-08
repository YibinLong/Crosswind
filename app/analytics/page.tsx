import { DashboardHeader } from "@/components/dashboard-header"
import { AnalyticsOverview } from "@/components/analytics-overview"
import { PerformanceCharts } from "@/components/performance-charts"
import { WeatherImpactAnalysis } from "@/components/weather-impact-analysis"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics & Insights</h1>
            <p className="text-slate-600">Track your flight operations and weather impact metrics</p>
          </div>
        </div>

        <AnalyticsOverview />
        <PerformanceCharts />
        <WeatherImpactAnalysis />
      </main>
    </div>
  )
}
