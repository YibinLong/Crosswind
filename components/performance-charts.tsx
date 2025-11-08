"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const flightData = [
  { month: "Jul", booked: 32, completed: 28, cancelled: 4 },
  { month: "Aug", booked: 38, completed: 34, cancelled: 4 },
  { month: "Sep", booked: 42, completed: 39, cancelled: 3 },
  { month: "Oct", booked: 45, completed: 41, cancelled: 4 },
  { month: "Nov", booked: 48, completed: 45, cancelled: 3 },
  { month: "Dec", booked: 42, completed: 38, cancelled: 4 },
]

const weatherData = [
  { week: "Week 1", conflicts: 4 },
  { week: "Week 2", conflicts: 6 },
  { week: "Week 3", conflicts: 3 },
  { week: "Week 4", conflicts: 5 },
  { week: "Week 5", conflicts: 7 },
  { week: "Week 6", conflicts: 4 },
]

export function PerformanceCharts() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Flight Activity Chart */}
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Flight Activity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              booked: {
                label: "Booked",
                color: "hsl(200, 100%, 50%)",
              },
              completed: {
                label: "Completed",
                color: "hsl(140, 70%, 45%)",
              },
              cancelled: {
                label: "Cancelled",
                color: "hsl(0, 70%, 55%)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={flightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="month" stroke="#475569" />
                <YAxis stroke="#475569" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="booked" stroke="hsl(200, 100%, 50%)" strokeWidth={2} name="Booked" />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(140, 70%, 45%)"
                  strokeWidth={2}
                  name="Completed"
                />
                <Line type="monotone" dataKey="cancelled" stroke="hsl(0, 70%, 55%)" strokeWidth={2} name="Cancelled" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Weather Conflicts Chart */}
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Weather Conflicts Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              conflicts: {
                label: "Conflicts",
                color: "hsl(30, 90%, 55%)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weatherData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="week" stroke="#475569" />
                <YAxis stroke="#475569" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="conflicts" fill="hsl(30, 90%, 55%)" name="Conflicts" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
