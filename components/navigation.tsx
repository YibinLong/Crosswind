"use client"

import { Button } from "@/components/ui/button"
import { Plane, Wind, Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-blue-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <Plane className="h-8 w-8 text-blue-600" />
              <Wind className="h-4 w-4 text-orange-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Crosswind
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
              Dashboard
            </Link>
            <Link href="/flights" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
              Flights
            </Link>
            <Link href="/analytics" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
              Analytics
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-slate-700 hover:text-blue-600">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-200">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-slate-700" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-white border-blue-200">
              <div className="flex flex-col gap-4 mt-8">
                <Link
                  href="/dashboard"
                  className="text-slate-700 hover:text-blue-600 transition-colors text-lg font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/flights"
                  className="text-slate-700 hover:text-blue-600 transition-colors text-lg font-medium"
                >
                  Flights
                </Link>
                <Link
                  href="/analytics"
                  className="text-slate-700 hover:text-blue-600 transition-colors text-lg font-medium"
                >
                  Analytics
                </Link>
                <Link href="/login" className="mt-4">
                  <Button variant="outline" className="w-full border-blue-300 hover:bg-blue-50 bg-transparent">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-200">
                    Get Started
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
