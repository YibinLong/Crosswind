"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plane, Wind } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate with backend authentication
    console.log("Login:", { email, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="relative">
            <Plane className="h-10 w-10 text-blue-600" />
            <Wind className="h-5 w-5 text-orange-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Crosswind
          </span>
        </Link>

        <Card className="bg-white border-blue-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-slate-900">Welcome back</CardTitle>
            <CardDescription className="text-slate-600">Sign in to your Crosswind account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="pilot@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-200"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-blue-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button variant="outline" className="bg-white border-blue-200 text-slate-700 hover:bg-blue-50">
                  Google
                </Button>
                <Button variant="outline" className="bg-white border-blue-200 text-slate-700 hover:bg-blue-50">
                  Microsoft
                </Button>
              </div>
            </div>

            <p className="text-center text-sm text-slate-600 mt-6">
              {"Don't have an account? "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
