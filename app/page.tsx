import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Cloud, Zap, Calendar, TrendingUp, ArrowRight, Plane, Wind, Clock } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-cyan-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Plane className="h-8 w-8 text-blue-600" />
                <Wind className="h-4 w-4 text-orange-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Crosswind
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
                How It Works
              </a>
              <a href="#pricing" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
                Pricing
              </a>
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-300 rounded-full mb-6 animate-fade-in-up shadow-sm">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-slate-700 font-medium">AI-Powered Flight Scheduling</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
              <span className="text-slate-900">Never Let Weather</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                Ground Your Training
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed text-balance">
              Crosswind automatically monitors weather conditions, detects conflicts, and uses AI to intelligently
              reschedule your flight lessons. Stay in the air, not on the ground.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg px-8 h-14 group shadow-lg shadow-blue-300/50"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-14 border-blue-300 hover:bg-blue-50 bg-white shadow-md"
                >
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-4 shadow-md">
                <div className="text-3xl font-bold text-blue-600">98%</div>
                <div className="text-sm text-slate-600">Conflict Detection</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md">
                <div className="text-3xl font-bold text-orange-600">3 min</div>
                <div className="text-sm text-slate-600">Avg Reschedule Time</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md">
                <div className="text-3xl font-bold text-cyan-600">24/7</div>
                <div className="text-sm text-slate-600">Weather Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Built for Modern Aviation</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to keep your flight training on schedule, powered by AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-white border-blue-200 hover:border-blue-400 transition-all hover:shadow-xl hover:shadow-blue-100 group">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-300/50">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Real-Time Weather Monitoring</h3>
              <p className="text-slate-600 leading-relaxed">
                Continuous monitoring of departure, arrival, and flight corridor weather conditions with automatic
                conflict detection.
              </p>
            </Card>

            <Card className="p-6 bg-white border-cyan-200 hover:border-cyan-400 transition-all hover:shadow-xl hover:shadow-cyan-100 group">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-300/50">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">AI-Powered Rescheduling</h3>
              <p className="text-slate-600 leading-relaxed">
                Intelligent algorithms consider student training levels, instructor availability, and weather patterns
                to suggest optimal alternatives.
              </p>
            </Card>

            <Card className="p-6 bg-white border-purple-200 hover:border-purple-400 transition-all hover:shadow-xl hover:shadow-purple-100 group">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-300/50">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Smart Notifications</h3>
              <p className="text-slate-600 leading-relaxed">
                Instant alerts for students and instructors via email and in-app notifications when weather conflicts
                are detected.
              </p>
            </Card>

            <Card className="p-6 bg-white border-green-200 hover:border-green-400 transition-all hover:shadow-xl hover:shadow-green-100 group">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-green-300/50">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Training Level Awareness</h3>
              <p className="text-slate-600 leading-relaxed">
                Applies appropriate weather minimums based on student certification level - Student, Private, or
                Instrument rated.
              </p>
            </Card>

            <Card className="p-6 bg-white border-orange-200 hover:border-orange-400 transition-all hover:shadow-xl hover:shadow-orange-100 group">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-300/50">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Complete History Tracking</h3>
              <p className="text-slate-600 leading-relaxed">
                Full audit trail of all bookings, cancellations, and reschedules for analytics and compliance.
              </p>
            </Card>

            <Card className="p-6 bg-white border-blue-200 hover:border-blue-400 transition-all hover:shadow-xl hover:shadow-blue-100 group">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-300/50">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Comprehensive Dashboard</h3>
              <p className="text-slate-600 leading-relaxed">
                Live view of active flights, weather alerts, and schedule status all in one intuitive interface.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How Crosswind Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Seamless automation from detection to confirmation
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-blue-300/50">
                1
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Monitor Weather</h3>
              <p className="text-slate-600 text-sm">Continuous tracking of all flight locations every hour</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-cyan-300/50">
                2
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Detect Conflicts</h3>
              <p className="text-slate-600 text-sm">AI identifies unsafe conditions based on training level</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-purple-300/50">
                3
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Generate Options</h3>
              <p className="text-slate-600 text-sm">AI suggests 3 optimal reschedule alternatives instantly</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-600 to-orange-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-pink-300/50">
                4
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Notify & Confirm</h3>
              <p className="text-slate-600 text-sm">Students and instructors choose the best option with one click</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-white border-2 border-blue-300 shadow-2xl shadow-blue-200/50">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Ready to Take Flight?</h2>
              <p className="text-xl text-slate-600 mb-8">
                Join forward-thinking flight schools using AI to optimize training schedules
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg px-8 h-14 shadow-lg shadow-blue-300/50"
                >
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-blue-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">Crosswind</span>
            </div>
            <div className="text-slate-600 text-sm">© 2025 Crosswind. Built with AI. Powered by innovation.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
