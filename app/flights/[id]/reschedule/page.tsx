"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { RescheduleDialog } from "@/components/reschedule-dialog"
import { api, Booking } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"

export default function FlightReschedulePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [flight, setFlight] = useState<Booking | null>(null)
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFlight = async () => {
      try {
        setLoading(true)
        setError(null)
        const idNum = Number(params.id)
        if (!idNum || Number.isNaN(idNum)) {
          setError("Invalid flight id")
          return
        }
        const response = await api.bookings.getById(idNum)
        setFlight(response.data)
      } catch (e: any) {
        setError(e?.response?.data?.error || "Failed to load flight")
      } finally {
        setLoading(false)
      }
    }
    fetchFlight()
  }, [params.id])

  const handleSuccess = () => {
    setOpen(false)
    // After successful reschedule, return to flights list
    router.push("/flights")
  }

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto mt-10 bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading flight...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-slate-600">
          Please wait while we fetch the flight details.
        </CardContent>
      </Card>
    )
  }

  if (error || !flight) {
    return (
      <Card className="max-w-2xl mx-auto mt-10 bg-white border-red-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Unable to open reschedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-600 text-sm">{error || "Flight not found"}</p>
          <Button variant="outline" className="border-blue-300" onClick={() => router.push("/flights")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Flights
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4">
      <Button
        variant="outline"
        className="mb-4 border-blue-300 text-slate-700 hover:bg-blue-50"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <RescheduleDialog
        open={open}
        onOpenChange={setOpen}
        flight={flight}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

