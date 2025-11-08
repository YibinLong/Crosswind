"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface BookFlightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookFlightDialog({ open, onOpenChange }: BookFlightDialogProps) {
  const [formData, setFormData] = useState({
    student: "",
    date: "",
    time: "",
    departure: "",
    arrival: "",
    instructor: "",
    aircraft: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate with backend API
    console.log("Book flight:", formData)
    onOpenChange(false)
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student" className="text-slate-700">
                Student
              </Label>
              <Select value={formData.student} onValueChange={(value) => setFormData({ ...formData, student: value })}>
                <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="sarah" className="text-slate-900">
                    Sarah Johnson
                  </SelectItem>
                  <SelectItem value="mike" className="text-slate-900">
                    Mike Chen
                  </SelectItem>
                  <SelectItem value="emma" className="text-slate-900">
                    Emma Wilson
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor" className="text-slate-700">
                Instructor
              </Label>
              <Select
                value={formData.instructor}
                onValueChange={(value) => setFormData({ ...formData, instructor: value })}
              >
                <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="james" className="text-slate-900">
                    Capt. James Miller
                  </SelectItem>
                  <SelectItem value="sarah" className="text-slate-900">
                    Capt. Sarah Davis
                  </SelectItem>
                  <SelectItem value="robert" className="text-slate-900">
                    Capt. Robert Lee
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-700">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-white border-blue-200 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-slate-700">
                Time
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
                Departure
              </Label>
              <Input
                id="departure"
                placeholder="KJFK"
                value={formData.departure}
                onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
                className="bg-white border-blue-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrival" className="text-slate-700">
                Arrival
              </Label>
              <Input
                id="arrival"
                placeholder="KTEB"
                value={formData.arrival}
                onChange={(e) => setFormData({ ...formData, arrival: e.target.value })}
                className="bg-white border-blue-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aircraft" className="text-slate-700">
              Aircraft
            </Label>
            <Select value={formData.aircraft} onValueChange={(value) => setFormData({ ...formData, aircraft: value })}>
              <SelectTrigger className="bg-white border-blue-200">
                <SelectValue placeholder="Select aircraft" />
              </SelectTrigger>
              <SelectContent className="bg-white border-blue-200">
                <SelectItem value="n12345" className="text-slate-900">
                  Cessna 172 (N12345)
                </SelectItem>
                <SelectItem value="n67890" className="text-slate-900">
                  Piper PA-28 (N67890)
                </SelectItem>
                <SelectItem value="n24680" className="text-slate-900">
                  Cessna 172 (N24680)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200"
            >
              Book Flight
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-blue-300 text-slate-700 hover:bg-blue-50"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
