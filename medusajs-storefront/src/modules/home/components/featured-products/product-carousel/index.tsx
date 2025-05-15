"use client"

import React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid"

export default function ProductCarousel({
  containerId,
}: {
  containerId: string
}) {
  const scrollLeft = () => {
    const container = document.getElementById(containerId)
    container?.scrollBy({ left: -300, behavior: "smooth" })
  }

  const scrollRight = () => {
    const container = document.getElementById(containerId)
    container?.scrollBy({ left: 300, behavior: "smooth" })
  }

  return (
    <>
      <button
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-all duration-200"
        onClick={scrollLeft}
        aria-label="Scroll left"
      >
        <ChevronLeftIcon className="w-4 h-4 text-gray-800" />
      </button>
      <button
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-all duration-200"
        onClick={scrollRight}
        aria-label="Scroll right"
      >
        <ChevronRightIcon className="w-4 h-4 text-gray-800" />
      </button>
    </>
  )
}
