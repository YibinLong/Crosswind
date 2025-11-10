"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plane } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/authContext"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    trainingLevel: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("") // Clear any previous errors

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.trainingLevel) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    try {
      setLoading(true)

      const response = await api.auth.signup(formData.email, formData.password, formData.name, formData.trainingLevel)
      const { user, token, sampleData } = response.data

      // Note: Student profile is already created in the signup API
      // No need to create a separate student profile

      // Store token and user context
      await login(token, user)

      // Show success message with sample data info
      let successMessage = `Welcome to Crosswind, ${user.name}!`
      if (sampleData && user.role === 'student') {
        successMessage += ` We've created ${sampleData.totalFlights} sample flights and ${sampleData.conflictAlerts} weather alerts for you to explore.`
      }
      toast.success(successMessage)

      // Redirect to dashboard
      router.push("/dashboard")

    } catch (error: any) {
      console.error("Signup error:", error)

      // Handle 409 error specifically to show inline error message
      if (error.response?.status === 409) {
        setError("A user is already associated with this email address. Try signing in instead.")
        return
      }

      // Handle other errors with toast
      let errorMessage = "Failed to create account"
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
        // Add more specific error details for 409 errors
        if (error.response.data.details) {
          const details = error.response.data.details
          if (details.suggestion) {
            errorMessage += `. ${details.suggestion}`
          }
        }
      } else if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        errorMessage = error.response.data.details.map((d: any) => d.message).join(", ")
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid input. Please check your form data."
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Plane className="h-10 w-10 text-blue-600" />
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Crosswind
          </span>
        </Link>

        <Card className="bg-white border-blue-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-slate-900">Create an account</CardTitle>
            <CardDescription className="text-slate-600">Get started with Crosswind today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-white border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="pilot@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setError("") // Clear error when user starts typing
                  }}
                  required
                  className="bg-white border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trainingLevel" className="text-slate-700">
                  Training Level
                </Label>
                <Select
                  value={formData.trainingLevel}
                  onValueChange={(value) => setFormData({ ...formData, trainingLevel: value })}
                >
                  <SelectTrigger className="bg-white border-blue-200 text-slate-900 focus:border-blue-500">
                    <SelectValue placeholder="Select your certification level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-blue-200">
                    <SelectItem value="student-pilot" className="text-slate-900">
                      Student Pilot
                    </SelectItem>
                    <SelectItem value="private-pilot" className="text-slate-900">
                      Private Pilot
                    </SelectItem>
                    <SelectItem value="instrument-rated" className="text-slate-900">
                      Instrument Rated
                    </SelectItem>
                    <SelectItem value="commercial-pilot" className="text-slate-900">
                      Commercial Pilot
                    </SelectItem>
                    <SelectItem value="instructor" className="text-slate-900">
                      Flight Instructor
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-white border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Error message display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <p className="text-center text-sm text-slate-600 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
