import { Customer, Region } from "@medusajs/medusa"
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import PreviewQuantity from "@modules/products/components/product-preview/quantity"

type ProductTemplateProps = {
  product: PricedProduct
  region: Region
  countryCode: string
  customer: Omit<Customer, "password_hash"> | null
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  customer,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const quantity = product.variants[0].inventory_quantity ?? -1
  const isCustomerSignedIn = !!customer
  const isCustomerApproved = !!customer?.metadata?.approved

  return (
    <>
      <div
        className="content-container flex flex-col small:flex-row small:items-start py-6 relative"
        data-testid="product-container"
      >
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-6">
          <ProductInfo product={product} />
          <ProductTabs product={product} />
          <ProductOnboardingCta />
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
                customer={customer}
              />
            }
          >
            <ProductActionsWrapper
              id={product.id}
              region={region}
              customer={customer}
            />
            {/* Show quantity only for signed-in and approved customers */}
            {isCustomerSignedIn && isCustomerApproved && (
                <PreviewQuantity quantity={{available_quantity: quantity}} />
            )}
          </Suspense>
        </div>
        <div className="block w-full relative">
          <ImageGallery images={product?.images || []} />
        </div>
      </div>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} customer={customer} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
