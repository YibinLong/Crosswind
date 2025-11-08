"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Cloud, Sparkles, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flight: {
    id: string
    student: string
    trainingLevel: string
    weatherIssue?: string
  } | null
}

// Mock AI-generated reschedule options
const mockRescheduleOptions = [
  {
    id: 1,
    date: "Tomorrow, Jan 16",
    time: "10:00 AM - 12:00 PM",
    weather: "Clear skies, Winds 5kt",
    confidence: 98,
    reason: "Optimal weather conditions for student pilot training",
  },
  {
    id: 2,
    date: "Jan 17, Thursday",
    time: "2:00 PM - 4:00 PM",
    weather: "Partly cloudy, Winds 8kt",
    confidence: 92,
    reason: "Good visibility, instructor available",
  },
  {
    id: 3,
    date: "Jan 18, Friday",
    time: "9:00 AM - 11:00 AM",
    weather: "Clear skies, Winds 6kt",
    confidence: 95,
    reason: "Excellent conditions, aircraft available",
  },
]

export function RescheduleDialog({ open, onOpenChange, flight }: RescheduleDialogProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleConfirm = () => {
    // TODO: Integrate with backend API
    console.log("Confirmed reschedule option:", selectedOption)
    onOpenChange(false)
    setSelectedOption(null)
  }

  if (!flight) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-blue-200 text-slate-900 max-w-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-slate-900">
            <Sparkles className="h-6 w-6 text-cyan-600" />
            AI-Powered Rescheduling
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Flight {flight.id} for {flight.student} • {flight.trainingLevel}
          </DialogDescription>
        </DialogHeader>

        {flight.weatherIssue && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Weather Conflict:</strong> {flight.weatherIssue}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              AI has analyzed weather patterns, instructor availability, and student training requirements
            </p>
            {isGenerating && <Badge className="bg-blue-100 text-blue-700 border-blue-300">Generating...</Badge>}
          </div>

          {mockRescheduleOptions.map((option) => (
            <Card
              key={option.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedOption === option.id
                  ? "bg-blue-100 border-blue-400 shadow-lg shadow-blue-200"
                  : "bg-white border-blue-200 hover:border-blue-300 hover:shadow-md"
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-300/50">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-900 font-semibold">{option.date}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="h-3 w-3" />
                      {option.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-300">{option.confidence}% Match</Badge>
                  {selectedOption === option.id && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2 text-sm">
                <Cloud className="h-4 w-4 text-cyan-600" />
                <span className="text-slate-700">{option.weather}</span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{option.reason}</p>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleConfirm}
            disabled={selectedOption === null}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 shadow-lg shadow-blue-200"
          >
            Confirm Reschedule
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setSelectedOption(null)
            }}
            className="border-blue-300 text-slate-700 hover:bg-blue-50"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
