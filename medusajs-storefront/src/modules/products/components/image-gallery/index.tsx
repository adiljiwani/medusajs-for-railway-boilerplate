import { Image as MedusaImage } from "@medusajs/medusa"
import ImageGalleryWithThumbnails from "@modules/products/components/image-gallery/image-gallery-with-thumbnails"

type ImageGalleryProps = {
  images: MedusaImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  return <ImageGalleryWithThumbnails images={images} />
}

export default ImageGallery
