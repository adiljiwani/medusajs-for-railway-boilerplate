"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"

interface BannerCarouselProps {
  banners: {
    imageUrl: string
    linkUrl: string
    altText?: string
  }[]
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSliding, setIsSliding] = useState(false)

  const handlePrev = () => {
    if (isSliding) return
    setIsSliding(true)
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? banners.length - 1 : prevIndex - 1
      )
      setIsSliding(false)
    }, 500)
  }

  const handleNext = () => {
    if (isSliding) return
    setIsSliding(true)
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      )
      setIsSliding(false)
    }, 500)
  }

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full overflow-hidden">
      {/* Arrows */}
      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-200 rounded-full"
        onClick={handlePrev}
        aria-label="Previous Banner"
      >
        {"<"}
      </button>
      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-200 rounded-full"
        onClick={handleNext}
        aria-label="Next Banner"
      >
        {">"}
      </button>

      {/* Banner Images */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {banners.map((banner, index) => (
          <a
            href={banner.linkUrl}
            key={index}
            className="block min-w-full"
            aria-label={banner.altText}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.altText || "Banner"}
              width={1920}
              height={600}
              priority={index === currentIndex}
              className="w-full h-auto"
              style={{ objectFit: "cover" }}
            />
          </a>
        ))}
      </div>
    </div>
  )
}
