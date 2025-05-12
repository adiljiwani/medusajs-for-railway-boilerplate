import { Customer, Region } from "@medusajs/medusa"
import ProductRail from "@modules/home/components/featured-products/product-rail"
import { ProductCollectionWithPreviews } from "types/global"

export default async function FeaturedProducts({
  collections,
  region,
  customer,
}: {
  collections: ProductCollectionWithPreviews[]
  region: Region
  customer: Omit<Customer, "password_hash"> | null
}) {
  return collections.map((collection) => (
    <li key={collection.id}>
      <ProductRail
        products={collection.products}
        region={region}
        title={collection.title}
        viewAllLink={`/collections/${collection.handle}`}
        customer={customer}
      />
    </li>
  ))
}
