import { retrievePricedProductById } from "@lib/data"
import { Customer, Region } from "@medusajs/medusa"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
  customer,
}: {
  id: string
  region: Region
  customer: Omit<Customer, "password_hash"> | null
}) {
  const product = await retrievePricedProductById({ id, regionId: region.id })

  if (!product) {
    return null
  }

  return (
    <ProductActions product={product} region={region} customer={customer} />
  )
}
