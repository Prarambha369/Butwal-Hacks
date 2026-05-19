"use client"

import { Mail, MapPin, Heart } from "lucide-react"
import Image from "next/image"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-red-500/20 bg-gradient-to-t from-slate-950 to-transparent py-8 sm:py-10 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-3 mb-3 sm:mb-4 justify-center sm:justify-start">
              <Image
                src="/logo.png"
                alt="Butwal Hacks Logo"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
              />
              <h3 className="text-white font-bold text-sm sm:text-base">Butwal Hacks</h3>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              Empowering the next generation of builders, creators, and innovators in Rupandehi District.
            </p>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">Location</h3>
            <div className="flex items-start gap-2 text-gray-400 text-xs sm:text-sm justify-center sm:justify-start">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 text-red-500" />
              <span>Butwal, Rupandehi District, Nepal</span>
            </div>
          </div>

          <div className="text-center sm:text-left sm:col-span-2 md:col-span-1">
            <h3 className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">Connect</h3>
            <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm justify-center sm:justify-start">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              <span>hello@butwalhacks.com</span>
            </div>
          </div>
        </div>

        <div className="border-t border-red-500/10 pt-6 sm:pt-8">
          <p className="text-center text-gray-500 text-xs sm:text-sm flex items-center justify-center gap-1 flex-wrap">
            © {currentYear} Butwal Hacks. Made with <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" /> by the community
          </p>
        </div>
      </div>
    </footer>
  )
}
