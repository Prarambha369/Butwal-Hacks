"use client"

import { useEffect, useRef } from "react"
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import type { SwiperRef } from "swiper/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import "swiper/css/effect-fade"

interface ImageSliderProps {
  images: Array<{
    url: string
    title: string
    description?: string
  }>
  autoplay?: boolean
  interval?: number
  height?: string
}

export function ImageSlider({
  images,
  autoplay = true,
  interval = 5000,
  height = "h-[500px]",
}: ImageSliderProps) {
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const swiperRef = useRef<SwiperRef>(null)

  useEffect(() => {
    if (swiperRef.current?.swiper) {
      const swiper = swiperRef.current.swiper
      const navParams = swiper?.params?.navigation as Record<string, unknown> | undefined
      if (navParams && typeof navParams === "object") {
        navParams.prevEl = prevRef.current || null
        navParams.nextEl = nextRef.current || null
        swiper.navigation.init()
        swiper.navigation.update()
      }
    }
  }, [])

  return (
    <div className={`relative w-full ${height} group overflow-hidden rounded-2xl`}>
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={autoplay ? { delay: interval, disableOnInteraction: false } : false}
        pagination={{
          clickable: true,
          dynamicBullets: true,
          bulletClass: "swiper-bullet",
          bulletActiveClass: "swiper-bullet-active",
        }}
        loop
        className="h-full w-full"
      >
        {images.map((image, idx) => (
          <SwiperSlide key={idx} className="h-full w-full">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${image.url})`,
              }}
            >
              <div className="flex h-full items-end justify-start bg-gradient-to-t from-black/80 to-transparent p-8">
                <div className="text-white">
                  <h3 className="text-3xl font-bold">{image.title}</h3>
                  {image.description && (
                    <p className="mt-2 text-sm text-gray-200">{image.description}</p>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation */}
      <button
        ref={prevRef}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/40 opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        ref={nextRef}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/40 opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      <style>{`
        .swiper-pagination {
          bottom: 20px;
          display: flex;
          justify-content: center;
          gap: 8px;
        }
        .swiper-bullet {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.3s;
        }
        .swiper-bullet-active {
          background-color: white;
          width: 30px;
          border-radius: 5px;
        }
      `}</style>
    </div>
  )
}

