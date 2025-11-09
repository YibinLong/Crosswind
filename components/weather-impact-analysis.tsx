"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Cloud, Wind, CloudRain, CloudSnow, Thermometer } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface WeatherFactor {
  factor: string
  incidents: number
  percentage: number
  icon: any
  color: string
}

interface AirportImpact {
  code: string
  name: string
  conflicts: number
  total: number
}

interface WeatherImpactData {
  weatherFactors: Array<{
    factor: string
    incidents: number
    percentage: number
  }>
  airportImpact: Array<{
    code: string
    name: string
    conflicts: number
    total: number
  }>
}

const getIconForFactor = (factor: string) => {
  const lowerFactor = factor.toLowerCase()
  if (lowerFactor.includes('wind') || lowerFactor.includes('crosswind')) {
    return { icon: Wind, color: "text-cyan-400" }
  }
  if (lowerFactor.includes('visibility') || lowerFactor.includes('ceiling')) {
    return { icon: Cloud, color: "text-slate-400" }
  }
  if (lowerFactor.includes('thunderstorm') || lowerFactor.includes('storm')) {
    return { icon: CloudRain, color: "text-yellow-400" }
  }
  if (lowerFactor.includes('temperature') || lowerFactor.includes('temp')) {
    return { icon: Thermometer, color: "text-orange-400" }
  }
  if (lowerFactor.includes('icing') || lowerFactor.includes('ice')) {
    return { icon: CloudSnow, color: "text-blue-400" }
  }
  return { icon: Cloud, color: "text-gray-400" }
}

export function WeatherImpactAnalysis() {
  const [data, setData] = useState<WeatherImpactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeatherImpactData = async () => {
      try {
        const response = await api.analytics.getWeatherImpact()
        if (response.data.success) {
          setData(response.data.data)
        }
      } catch (err) {
        console.error('Error fetching weather impact data:', err)
        setError('Failed to load weather impact data')
      } finally {
        setLoading(false)
      }
    }

    fetchWeatherImpactData()
  }, [])

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">Top Weather Conflict Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="space-y-2 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">Airports with Most Weather Conflicts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-100 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-12 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white border-blue-200 shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-200 shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const weatherFactors: WeatherFactor[] = data.weatherFactors.map(factor => {
    const { icon, color } = getIconForFactor(factor.factor)
    return {
      ...factor,
      icon,
      color,
    }
  })

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Weather Factors */}
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Top Weather Conflict Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weatherFactors.length > 0 ? (
            weatherFactors.map((factor, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <factor.icon className={`h-5 w-5 ${factor.color}`} />
                    <span className="text-slate-700 font-medium">{factor.factor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">{factor.incidents} incidents</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                      {factor.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={factor.percentage} className="h-2" />
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">No weather conflicts recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Airport Impact */}
      <Card className="bg-white border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Airports with Most Weather Conflicts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.airportImpact.length > 0 ? (
            data.airportImpact.map((airport, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-slate-900 font-semibold">{airport.code}</p>
                    <p className="text-sm text-slate-600">{airport.name}</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-300">{airport.conflicts} conflicts</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Conflict Rate</span>
                    <span className="text-slate-900 font-medium">
                      {Math.round((airport.conflicts / airport.total) * 100)}%
                    </span>
                  </div>
                  <Progress value={(airport.conflicts / airport.total) * 100} className="h-2" />
                  <div className="text-xs text-slate-500">
                    {airport.conflicts} of {airport.total} flights affected
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">No airport data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
