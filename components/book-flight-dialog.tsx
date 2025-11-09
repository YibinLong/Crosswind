"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { api, Student, Instructor, Aircraft } from "@/lib/api"

interface BookFlightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BookFlightDialog({ open, onOpenChange, onSuccess }: BookFlightDialogProps) {
  const [formData, setFormData] = useState({
    studentId: "",
    instructorId: "",
    aircraftId: "",
    date: "",
    time: "",
    departureLat: 40.7128, // Default to NYC area
    departureLon: -74.0060,
    arrivalLat: 40.7891, // Default to NYC area
    arrivalLon: -73.1349,
  })

  const [students, setStudents] = useState<Student[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchDropdownData()
    }
  }, [open])

  const fetchDropdownData = async () => {
    try {
      setLoading(true)

      const [studentsRes, instructorsRes, aircraftRes] = await Promise.all([
        api.students.getAll(),
        api.instructors.getAll(),
        api.aircraft.getAll({ available: true })
      ])

      setStudents(studentsRes.data)
      setInstructors(instructorsRes.data)
      setAircraft(aircraftRes.data)
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error)
      toast.error('Failed to load flight options')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.studentId || !formData.instructorId || !formData.aircraftId || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)

      // Combine date and time
      const scheduledDate = new Date(`${formData.date}T${formData.time}`)

      const bookingData = {
        studentId: parseInt(formData.studentId),
        instructorId: parseInt(formData.instructorId),
        aircraftId: parseInt(formData.aircraftId),
        scheduledDate: scheduledDate.toISOString(),
        departureLat: formData.departureLat,
        departureLon: formData.departureLon,
        arrivalLat: formData.arrivalLat,
        arrivalLon: formData.arrivalLon,
      }

      await api.bookings.create(bookingData)

      toast.success('Flight booked successfully!')
      onOpenChange(false)
      onSuccess?.()

      // Reset form
      setFormData({
        studentId: "",
        instructorId: "",
        aircraftId: "",
        date: "",
        time: "",
        departureLat: 40.7128,
        departureLon: -74.0060,
        arrivalLat: 40.7891,
        arrivalLon: -73.1349,
      })

    } catch (error: any) {
      console.error('Failed to book flight:', error)
      const errorMessage = error.response?.data?.message || 'Failed to book flight'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-blue-200 text-slate-900 max-w-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-slate-900">Book New Flight</DialogTitle>
          <DialogDescription className="text-slate-600">
            Schedule a new flight lesson. Weather monitoring will begin automatically.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student" className="text-slate-700">
                  Student *
                </Label>
                <Select
                  value={formData.studentId}
                  onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                  disabled={students.length === 0}
                >
                  <SelectTrigger className="bg-white border-blue-200">
                    <SelectValue placeholder={students.length === 0 ? "No students available" : "Select student"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-blue-200">
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()} className="text-slate-900">
                        {student.name} - {student.trainingLevel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor" className="text-slate-700">
                  Instructor *
                </Label>
                <Select
                  value={formData.instructorId}
                  onValueChange={(value) => setFormData({ ...formData, instructorId: value })}
                  disabled={instructors.length === 0}
                >
                  <SelectTrigger className="bg-white border-blue-200">
                    <SelectValue placeholder={instructors.length === 0 ? "No instructors available" : "Select instructor"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-blue-200">
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()} className="text-slate-900">
                        {instructor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-700">
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-white border-blue-200 text-slate-900"
                  min={new Date().toISOString().split('T')[0]} // Can't book in the past
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-slate-700">
                  Time *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="bg-white border-blue-200 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure" className="text-slate-700">
                  Departure Airport
                </Label>
                <Input
                  id="departure"
                  placeholder="KJFK"
                  value="KJFK" // Using default for now
                  disabled
                  className="bg-white border-blue-200 text-slate-900"
                />
                <p className="text-xs text-slate-500">Location coordinates will be used</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival" className="text-slate-700">
                  Arrival Airport
                </Label>
                <Input
                  id="arrival"
                  placeholder="KTEB"
                  value="KTEB" // Using default for now
                  disabled
                  className="bg-white border-blue-200 text-slate-900"
                />
                <p className="text-xs text-slate-500">Location coordinates will be used</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aircraft" className="text-slate-700">
                Aircraft *
              </Label>
              <Select
                value={formData.aircraftId}
                onValueChange={(value) => setFormData({ ...formData, aircraftId: value })}
                disabled={aircraft.length === 0}
              >
                <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue placeholder={aircraft.length === 0 ? "No aircraft available" : "Select aircraft"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  {aircraft.map((aircraftItem) => (
                    <SelectItem key={aircraftItem.id} value={aircraftItem.id.toString()} className="text-slate-900">
                      {aircraftItem.tailNumber} - {aircraftItem.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Weather monitoring will begin automatically once the flight is booked.
                You'll receive alerts if any weather conflicts are detected.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200"
              >
                {submitting ? 'Booking...' : 'Book Flight'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="border-blue-300 text-slate-700 hover:bg-blue-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
