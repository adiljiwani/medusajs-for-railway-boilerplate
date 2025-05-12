import { Customer, StoreGetProductsParams } from "@medusajs/medusa"
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"

import { getProductsList, getRegion } from "@lib/data"

import ProductRail from "@modules/home/components/featured-products/product-rail"

type RelatedProductsProps = {
  product: PricedProduct
  countryCode: string
  customer: Omit<Customer, "password_hash"> | null
}

export default async function RelatedProducts({
  product,
  countryCode,
  customer
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  const setQueryParams = (): StoreGetProductsParams => {
    const params: StoreGetProductsParams = {}

    if (region?.id) {
      params.region_id = region.id
    }

    if (region?.currency_code) {
      params.currency_code = region.currency_code
    }

    if (product.collection_id) {
      params.collection_id = [product.collection_id]
    }

    if (product.tags) {
      params.tags = product.tags.map((t) => t.value)
    }

    params.is_giftcard = false

    return params
  }

  const queryParams = setQueryParams()

  const productPreviews = await getProductsList({
    queryParams,
    countryCode,
  }).then(({ response }) =>
    response.products.filter(
      (productPreview) => productPreview.id !== product.id
    )
  )

  if (!productPreviews.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          You might also want to check out these products.
        </p>
      </div>

      <ProductRail
        products={productPreviews}
        region={region}
        title="Related Products"
        customer={customer}
      />
    </div>
  )
}
