"use client"

import { useState, useEffect } from "react"

interface Props {
  targetDate: string
}

export default function CountdownTimer({ targetDate }: Props) {
  const [remaining, setRemaining] = useState("")

  useEffect(() => {
    const target = new Date(targetDate).getTime()

    const tick = () => {
      const now = Date.now()
      const diff = target - now

      if (diff <= 0) {
        setRemaining("Starting...")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)

      if (days > 0) {
        setRemaining(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setRemaining(`${hours}h ${minutes}m`)
      } else {
        setRemaining(`${minutes}m`)
      }
    }

    tick()
    const interval = setInterval(tick, 60_000) // Update every minute
    return () => clearInterval(interval)
  }, [targetDate])

  if (!remaining) return null

  return (
    <span className="text-[10px] font-mono text-primary-red/70">
      {remaining}
    </span>
  )
}
