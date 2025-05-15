"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid"

interface BannerCarouselProps {
  banners: {
    imageUrl: string
    linkUrl: string
    altText?: string
  }[]
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(1) // Start at 1 because we add a clone at the start
  const [isSliding, setIsSliding] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Create an array with cloned first and last banners for seamless looping
  const extendedBanners = [
    banners[banners.length - 1], // Clone of last banner
    ...banners, // Original banners
    banners[0], // Clone of first banner
  ]

  const handlePrev = () => {
    if (isSliding) return
    setIsSliding(true)
    setCurrentIndex((prevIndex) => prevIndex - 1)
  }

  const handleNext = () => {
    if (isSliding) return
    setIsSliding(true)
    setCurrentIndex((prevIndex) => prevIndex + 1)
  }

  // Handle the transition when reaching the cloned banners
  useEffect(() => {
    if (!isSliding) return

    const timer = setTimeout(() => {
      setIsSliding(false)
      
      // If we're at the clone of the last banner, jump to the real last banner
      if (currentIndex === 0) {
        setIsTransitioning(true)
        setCurrentIndex(banners.length)
      }
      // If we're at the clone of the first banner, jump to the real first banner
      else if (currentIndex === banners.length + 1) {
        setIsTransitioning(true)
        setCurrentIndex(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [currentIndex, isSliding, banners.length])

  // Reset transition flag after the jump
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

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
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-all duration-200"
        onClick={handlePrev}
        aria-label="Previous Banner"
      >
        <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
      </button>
      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-all duration-200"
        onClick={handleNext}
        aria-label="Next Banner"
      >
        <ChevronRightIcon className="w-6 h-6 text-gray-800" />
      </button>

      {/* Banner Images */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning ? 'none' : 'transform 500ms ease-in-out',
        }}
      >
        {extendedBanners.map((banner, index) => (
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

      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (isSliding) return
              setIsSliding(true)
              setCurrentIndex(index + 1) // Add 1 because we have a clone at the start
            }}
            className={`transition-all duration-300 ${
              index === (currentIndex - 1) % banners.length
                ? "w-8 bg-white" // Pill shape for active
                : "w-2 bg-white/60 hover:bg-white/80" // Circle shape for inactive
            } h-2 rounded-full`}
            aria-label={`Go to banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
