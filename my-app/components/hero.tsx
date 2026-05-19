"use client"

import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import Image from "next/image"

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-16 sm:py-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gradient-to-br from-red-600/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gradient-to-tl from-red-700/20 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 right-0 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gradient-to-bl from-red-500/15 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div
        className={`relative z-10 text-center max-w-4xl transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="flex justify-center mb-4 sm:mb-6">
          <Image
            src="/logo.png"
            alt="Butwal Hacks Logo"
            width={150}
            height={150}
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-[150px] md:h-[150px] rounded-full shadow-lg shadow-red-500/30"
            priority
          />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
          <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
            Butwal Hacks
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-gray-300 mb-4 font-light tracking-wide">
          Empowering Builders, Creators, and Innovators
        </p>

        <p className="text-sm md:text-lg text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
          A student-led community where curiosity meets creativity. We create spaces for young minds to experiment,
          collaborate, and transform ideas into reality across Rupandehi District.
        </p>

        <div className="flex gap-3 sm:gap-4 justify-center flex-wrap px-2">
          <a
            href="#events"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            Explore Events
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>
          <a
            href="#mission"
            className="px-6 sm:px-8 py-3 rounded-lg border-2 border-red-500 text-red-400 font-semibold hover:bg-red-500/10 transition-all active:scale-95 text-sm sm:text-base"
          >
            Our Mission
          </a>
        </div>
      </div>
    </section>
  )
}
