"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, Cloud, Sparkles, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { api, Booking } from "@/lib/api"
import { format } from "date-fns"
import { RescheduleSuggestion } from "@/lib/types"

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flight: Booking | null
  onSuccess?: () => void
}

// Use the shared RescheduleSuggestion type but make selected field optional for UI state
type RescheduleOption = Omit<RescheduleSuggestion, 'selected'> & {
  selected?: boolean  // UI-only selection state
}

export function RescheduleDialog({ open, onOpenChange, flight, onSuccess }: RescheduleDialogProps) {
  const [selectedOption, setSelectedOption] = useState<number | string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<RescheduleOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  useEffect(() => {
    if (open && flight && !hasLoadedOnce) {
      generateSuggestions()
      setHasLoadedOnce(true)
    } else if (!open) {
      // Reset state when dialog closes
      console.log('🔍 [DEBUG] Dialog closed, resetting state')
      setSelectedOption(null)
      setSuggestions([])
      setError(null)
      setHasLoadedOnce(false)
      setIsGenerating(false)
    }
  }, [open, flight, hasLoadedOnce])

  const generateSuggestions = async () => {
    if (!flight) return

    try {
      setLoading(true)
      setError(null)
      setIsGenerating(true)

      // Debug: Log authentication state
      const token = localStorage.getItem('auth_token')
      console.log('🔍 [DEBUG] Auth token exists:', !!token)
      console.log('🔍 [DEBUG] Token length:', token?.length || 0)
      console.log('🔍 [DEBUG] Token starts with Bearer:', token?.startsWith('Bearer ') || false)

      // Debug: Log flight details
      console.log('🔍 [DEBUG] Flight ID:', flight.id)
      console.log('🔍 [DEBUG] Flight Status:', flight.status)
      console.log('🔍 [DEBUG] Flight Student:', flight.student?.name, flight.student?.email)
      console.log('🔍 [DEBUG] Request payload:', { forceRegenerate: true })

      // Debug: Log the API call
      console.log('🔍 [DEBUG] Making API call to:', `/api/bookings/${flight.id}/reschedule`)
      console.log('🔍 [DEBUG] Request method:', 'POST')
      console.log('🔍 [DEBUG] Request headers:', {
        'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'None',
        'Content-Type': 'application/json'
      })

      const response = await api.bookings.generateRescheduleSuggestions(flight.id, { forceRegenerate: true })

      // Debug: Log response details
      console.log('🔍 [DEBUG] Response status:', response.status)
      console.log('🔍 [DEBUG] Response headers:', response.headers)
      console.log('🔍 [DEBUG] Response data:', response.data)
      console.log('🔍 [DEBUG] Response data type:', typeof response.data)
      console.log('🔍 [DEBUG] Is response data array?', Array.isArray(response.data))

      const data = response.data
      let suggestions = Array.isArray(data) ? data : (data?.suggestions ?? [])
      console.log('🔍 [DEBUG] Extracted suggestions:', suggestions)
      console.log('🔍 [DEBUG] Suggestions count:', suggestions.length)

      // Sort suggestions chronologically (earliest first) with robust date parsing
      suggestions = suggestions.sort((a: RescheduleOption, b: RescheduleOption) => {
        try {
          // Create proper date objects by combining date and time
          const dateAString = `${a.proposedDate}T${a.proposedTime.padStart(5, '0')}:00`
          const dateBString = `${b.proposedDate}T${b.proposedTime.padStart(5, '0')}:00`

          const dateA = new Date(dateAString)
          const dateB = new Date(dateBString)

          // Validate dates
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            console.warn('Invalid date found in suggestions:', { a: a.proposedDate, aTime: a.proposedTime, b: b.proposedDate, bTime: b.proposedTime })
            return 0
          }

          const result = dateA.getTime() - dateB.getTime()
          console.log('🔍 [DEBUG] Sorting:', {
            a: { date: dateAString, time: dateA.getTime() },
            b: { date: dateBString, time: dateB.getTime() },
            result
          })

          return result
        } catch (error) {
          console.error('Error sorting suggestions:', error)
          return 0
        }
      })

      setSuggestions(suggestions)

    } catch (error: any) {
      console.error('❌ [ERROR] Failed to generate reschedule suggestions:', error)

      // Debug: Log detailed error information
      console.log('🔍 [DEBUG] Error name:', error.name)
      console.log('🔍 [DEBUG] Error message:', error.message)
      console.log('🔍 [DEBUG] Error response status:', error.response?.status)
      console.log('🔍 [DEBUG] Error response data:', error.response?.data)
      console.log('🔍 [DEBUG] Error response headers:', error.response?.headers)
      console.log('🔍 [DEBUG] Error config:', error.config)

      // Debug: Log request details if available
      if (error.config) {
        console.log('🔍 [DEBUG] Failed request URL:', error.config.url)
        console.log('🔍 [DEBUG] Failed request method:', error.config.method)
        console.log('🔍 [DEBUG] Failed request headers:', error.config.headers)
        console.log('🔍 [DEBUG] Failed request data:', error.config.data)
      }

      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to generate AI suggestions'
      console.log('🔍 [DEBUG] Final error message to display:', errorMessage)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
      setIsGenerating(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedOption || !flight) {
      console.log('🔍 [DEBUG] Cannot confirm reschedule:', {
        hasSelectedOption: !!selectedOption,
        hasFlight: !!flight,
        selectedOption,
        flightId: flight?.id
      })
      toast.error('Please select a reschedule option')
      return
    }

    // Extract the actual suggestion ID from our selection
    let actualSuggestionId: number
    if (typeof selectedOption === 'number') {
      actualSuggestionId = selectedOption
    } else if (typeof selectedOption === 'string' && selectedOption.startsWith('index-')) {
      // If we're using index fallback, find the corresponding suggestion
      const index = parseInt(selectedOption.replace('index-', ''), 10)
      const suggestion = suggestions[index]

      console.log('🔍 [DEBUG] Index fallback selection:', {
        index,
        suggestion,
        hasId: !!suggestion?.id,
        suggestionId: suggestion?.id
      })

      if (!suggestion) {
        toast.error(`Invalid selection: suggestion at index ${index} not found`)
        return
      }

      if (!suggestion.id) {
        toast.error('Invalid selection: suggestion does not have a valid ID. The AI-generated suggestions may not be properly saved to the database.')
        return
      }

      actualSuggestionId = suggestion.id
    } else {
      toast.error(`Invalid selection format: ${typeof selectedOption}`)
      return
    }

    try {
      console.log('🔍 [DEBUG] Starting reschedule confirmation:', {
        flightId: flight.id,
        selectedOption,
        actualSuggestionId,
        flightStatus: flight.status
      })

      setIsGenerating(true)

      // Debug: Log API call details
      console.log('🔍 [DEBUG] Making API call to:', `/api/bookings/${flight.id}/reschedule/confirm`)
      console.log('🔍 [DEBUG] Request payload:', { suggestionId: actualSuggestionId })

      const response = await api.bookings.confirmReschedule(flight.id, actualSuggestionId)

      // Debug: Log response details
      console.log('🔍 [DEBUG] Reschedule confirmation response:', response)
      console.log('🔍 [DEBUG] Response status:', response.status)
      console.log('🔍 [DEBUG] Response data:', response.data)

      // Check if the response indicates success
      if (response.data?.success) {
        toast.success('Flight rescheduled successfully!')
        console.log('🔍 [DEBUG] Reschedule successful, closing dialog')
        onOpenChange(false)
        onSuccess?.()
      } else {
        // Handle case where API returns error format but with 200 status
        const errorMessage = response.data?.error || response.data?.message || 'Reschedule failed'
        console.log('🔍 [DEBUG] API returned error response:', {
          status: response.status,
          data: response.data,
          errorMessage
        })
        toast.error(`Reschedule failed: ${errorMessage}`)
      }

    } catch (error: any) {
      console.error('❌ [ERROR] Failed to confirm reschedule:', error)

      // Debug: Log detailed error information
      console.log('🔍 [DEBUG] Error details:', {
        name: error.name,
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        config: error.config
      })

      // Extract meaningful error message
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to reschedule flight'

      console.log('🔍 [DEBUG] Final error message to display:', errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const getWeatherConflictMessage = () => {
    if (!flight || !hasWeatherConflict(flight)) return null

    const weatherReport = flight.weatherReports![0]
    const issues = weatherReport.violatedMinimums || []

    if (issues.includes('wind')) {
      return `Wind ${weatherReport.windKts}kt${weatherReport.windGustKts ? ` gusting ${weatherReport.windGustKts}kt` : ''} exceeds limits`
    }
    if (issues.includes('visibility')) {
      return `Visibility ${weatherReport.visibility} mi below minimum`
    }
    if (issues.includes('ceiling')) {
      return `Ceiling ${weatherReport.ceilingFt} ft below minimum`
    }

    return `Weather conditions: ${weatherReport.condition}`
  }

  const hasWeatherConflict = (booking: Booking) => {
    return booking.status === 'conflict' &&
           booking.weatherReports &&
           booking.weatherReports.length > 0 &&
           !booking.weatherReports[0].isSafe
  }

  if (!flight) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-blue-200 text-slate-900 max-w-3xl shadow-2xl" data-testid="reschedule-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-slate-900">
            <Sparkles className="h-6 w-6 text-cyan-600" />
            AI-Powered Rescheduling
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Flight FL-{String(flight.id).padStart(4, '0')} for {flight.student?.name || 'Unknown Student'} • {flight.student?.trainingLevel || 'Unknown Level'}
          </DialogDescription>
        </DialogHeader>

        {getWeatherConflictMessage() && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg" data-testid="weather-conflict">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">
                <strong>Weather Conflict:</strong> {getWeatherConflictMessage()}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">
                AI analyzes weather patterns, instructor availability, and training requirements to suggest optimal reschedule options.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isGenerating && <Badge className="bg-blue-100 text-blue-700 border-blue-300">Generating...</Badge>}
              <Button
                variant="outline"
                size="sm"
                onClick={generateSuggestions}
                disabled={isGenerating}
                className="border-blue-300 text-slate-700 hover:bg-blue-50"
                title="Get fresh AI recommendations"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate AI Options
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={generateSuggestions}
                className="mt-2 text-sm text-red-700 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 border border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))}
            </div>
          ) : suggestions.length === 0 && !error ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No suggestions available</p>
              <p className="text-slate-400 text-sm mt-2">
                Try regenerating or check back later for more options.
              </p>
            </div>
          ) : (
            suggestions.map((option, index) => {
              const optionKey = option.id || `index-${index}`
              return (
                <Card
                  key={`reschedule-option-${optionKey}`}
                  data-testid="reschedule-option"
                  className={`p-4 cursor-pointer transition-all ${
                    selectedOption === optionKey
                      ? "bg-blue-100 border-blue-400 shadow-lg shadow-blue-200"
                      : "bg-white border-blue-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                  onClick={() => {
                    console.log('🔍 [DEBUG] Clicking option:', {
                      id: option.id,
                      optionKey,
                      proposedDate: option.proposedDate,
                      proposedTime: option.proposedTime,
                      currentSelected: selectedOption
                    })

                    // Only select the clicked option, ensuring no other options are affected
                    const newSelection = optionKey
                    console.log('🔍 [DEBUG] Setting selected option to:', newSelection)
                    setSelectedOption(newSelection)
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-300/50">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-semibold">
                        {format(new Date(option.proposedDate), 'EEEE, MMM d')}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-3 w-3" />
                        {option.proposedTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      {Math.round(option.confidence * 100)}% Match
                    </Badge>
                    {selectedOption === optionKey && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 text-sm">
                  <Cloud className="h-4 w-4 text-cyan-600" />
                  <span className="text-slate-700">{option.weatherSummary}</span>
                </div>

                  <p className="text-sm text-slate-600 leading-relaxed">{option.reason}</p>
                </Card>
              )
            })
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleConfirm}
            disabled={selectedOption === null || isGenerating}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 shadow-lg shadow-blue-200"
          >
            {isGenerating ? 'Confirming...' : `Confirm Reschedule${selectedOption ? ` (Option ${selectedOption})` : ''}`}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log('🔍 [DEBUG] Cancel clicked, resetting selection')
              setSelectedOption(null)
              onOpenChange(false)
            }}
            disabled={isGenerating}
            className="border-blue-300 text-slate-700 hover:bg-blue-50"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
