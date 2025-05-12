"use client"

import { useState } from "react"
import { Image as MedusaImage } from "@medusajs/medusa"
import { Container } from "@medusajs/ui"
import Image from "next/image"

type ImageGalleryWithThumbnailsProps = {
  images: MedusaImage[]
}

const ImageGalleryWithThumbnails = ({
  images,
}: ImageGalleryWithThumbnailsProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Skip rendering the gallery if there are no images
  if (!images || images.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col items-center">
      <Container className="relative aspect-[29/34] w-[50%] max-w-[600px] overflow-hidden bg-ui-bg-subtle">
        <Image
          src={images[selectedImageIndex].url}
          priority={true}
          className="absolute inset-0 rounded-rounded"
          alt={`Product image ${selectedImageIndex + 1}`}
          draggable={false}
          fill
        />
      </Container>

      <div className="flex mt-4 gap-2">
        {images.map((image, index) => (
          <Container
            key={image.id}
            className={`relative aspect-square overflow-hidden cursor-pointer ${
              selectedImageIndex === index
                ? "border-4 border-ui-fg-interactive"
                : "border"
            }`}
            onClick={() => setSelectedImageIndex(index)}
          >
            <Image
              src={image.url}
              alt={`Thumbnail ${index + 1}`}
              className="absolute inset-0"
              draggable={false}
              fill
            />
          </Container>
        ))}
      </div>
    </div>
  )
}

export default ImageGalleryWithThumbnails
