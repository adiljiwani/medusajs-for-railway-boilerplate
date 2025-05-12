import { Customer, Region } from "@medusajs/medusa"
import { Text } from "@medusajs/ui"
import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"
import { ProductPreviewType } from "types/global"
import ProductCarousel from "@modules/home/components/featured-products/product-carousel"

interface ProductRailProps {
  products: ProductPreviewType[]
  region: Region
  title: string
  viewAllLink?: string
  customer: Omit<Customer, "password_hash"> | null
}
export default function ProductRails({
  products,
  region,
  title,
  viewAllLink,
  customer,
}: ProductRailProps) {
  if (!products) {
    return null
  }

  const carouselContainerId = `product-carousel-${title}`

  return (
    <div className="content-container py-12 small:py-4">
      <div className="flex justify-between mb-4">
        <Text className="txt-xlarge">{title}</Text>
        {viewAllLink && (
          <InteractiveLink href={viewAllLink}>View all</InteractiveLink>
        )}
      </div>
      {/* The client component,  ProductCarousel, will add interactivity to this list */}
      <div className="relative">
        <ProductCarousel containerId={carouselContainerId} />
        <ul
          id={carouselContainerId}
          className="flex overflow-x-scroll no-scrollbar space-x-6"
        >
          {products.map((product) => (
            <li key={product.id} className="flex-none w-60">
              <ProductPreview
                productPreview={product}
                region={region}
                isFeatured
                customer={customer}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
