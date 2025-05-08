import { Text, clx } from "@medusajs/ui"
import { ProductPreviewType } from "types/global"
import { retrievePricedProductById, getCustomer } from "@lib/data"
import { getProductPrice } from "@lib/util/get-product-price"
import { Customer, Region } from "@medusajs/medusa"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import PreviewQuantity from "./quantity"
import ProductPreviewCartActions from "@modules/products/components/product-preview/product-preview-cart-actions"

export default async function ProductPreview({
  productPreview,
  isFeatured,
  region,
  customer,
}: {
  productPreview: ProductPreviewType
  isFeatured?: boolean
  region: Region
  customer: Omit<Customer, "password_hash"> | null
}) {
  const pricedProduct = await retrievePricedProductById({
    id: productPreview.id,
    regionId: region.id,
  }).then((product) => product)

  if (!pricedProduct) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
    region,
  })

  // NOTE: as per the current design, this assumes that each product has a single variant
  const variant = pricedProduct.variants[0]
  const quantity = pricedProduct.variants[0].inventory_quantity ?? -1
  const sku = pricedProduct.handle ?? "N/A"

  // Get customer details and their approval status
  const isCustomerSignedIn = !!customer
  const isCustomerApproved = !!customer?.metadata?.approved

  return (
    <div data-testid="product-wrapper" className="flex flex-col h-full">
      <LocalizedClientLink
        href={`/products/${productPreview.handle}`}
        className="flex-1"
      >
        <Thumbnail
          thumbnail={productPreview.thumbnail}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="flex flex-col gap-1 mt-2">
          <Text
            className="text-ui-fg-subtle text-sm line-clamp-2"
            data-testid="product-title"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minHeight: "3.0em",
              lineHeight: "1.5em",
            }}
          >
            {productPreview.title}
          </Text>

          <Text
            className={clx("text-ui-fg-muted")}
            data-testid="quantity"
          >
            {"SKU: "+ sku}
          </Text>

          {/* Show price only for signed-in and approved customers */}
          {isCustomerSignedIn && isCustomerApproved && cheapestPrice && (
            <PreviewPrice price={cheapestPrice} />
          )}
        </div>
      </LocalizedClientLink>

      {/* Allow cart actions for signed-in customers */}
      <div className="mt-2">
        <ProductPreviewCartActions
          variantId={variant.id}
          region={region}
          handle={productPreview.handle}
          customer={customer}
        />
      </div>
      {/* Show quantity for signed-in and approved customers */}
      {isCustomerSignedIn && isCustomerApproved && (
        <PreviewQuantity quantity={{available_quantity: quantity}} />
      )}
    </div>
  )
}
