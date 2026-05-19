"use client"

import { useState } from "react"
import { Lightbulb, Sparkles, Users, Globe } from "lucide-react"

interface MissionPillar {
  title: string
  description: string
  icon: typeof Lightbulb
}

const pillars: MissionPillar[] = [
  {
    title: "Curiosity",
    description: "Fostering the desire to explore, learn, and ask questions about technology",
    icon: Lightbulb,
  },
  {
    title: "Creativity",
    description: "Empowering students to turn ideas into real projects and solutions",
    icon: Sparkles,
  },
  {
    title: "Collaboration",
    description: "Building a supportive community where knowledge is shared freely",
    icon: Users,
  },
  {
    title: "Community",
    description: "Creating lasting spaces for growth beyond the classroom",
    icon: Globe,
  },
]

export default function Mission() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <section id="mission" className="py-12 sm:py-16 md:py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">What We Stand For</h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-2">
            Butwal Hacks exists to support young people. Every event and program is created with a focus on learning,
            growth, and accessibility.
          </p>
        </div>

        <div className="mb-8 sm:mb-12 md:mb-16 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm">
          <p className="text-gray-300 text-center text-sm sm:text-base md:text-lg leading-relaxed">
            In Rupandehi District, access to tech events and creative communities is still developing. Many students
            have talent and passion but lack opportunities to practice skills in coding, design, engineering, robotics,
            and digital creativity. Butwal Hacks fills that gap with a platform that is open, inclusive, supportive, and
            driven by students who understand other students.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon
            return (
              <button
                key={index}
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className={`group relative p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl transition-all duration-300 cursor-pointer text-left ${
                  activeIndex === index
                    ? "bg-gradient-to-br from-red-600 to-red-700 scale-[1.02] sm:scale-105"
                    : "bg-gradient-to-br from-red-900/30 to-red-800/30 hover:from-red-800/50 hover:to-red-700/50"
                } border border-red-500/20 hover:border-red-500/50 active:scale-[0.98]`}
              >
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mb-2 sm:mb-3 ${activeIndex === index ? "text-white" : "text-red-400"}`} />
                <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 ${activeIndex === index ? "text-white" : "text-red-200"}`}>
                  {pillar.title}
                </h3>
                <p
                  className={`text-xs sm:text-sm leading-relaxed transition-all ${
                    activeIndex === index ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                  }`}
                >
                  {pillar.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
