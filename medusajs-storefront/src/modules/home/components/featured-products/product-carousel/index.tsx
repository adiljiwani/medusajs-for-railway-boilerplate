"use client"

import React from "react"

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
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-200"
        onClick={scrollLeft}
      >
        {"<"}
      </button>
      <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-gray-200"
        onClick={scrollRight}
      >
        {">"}
      </button>
    </>
  )
}
