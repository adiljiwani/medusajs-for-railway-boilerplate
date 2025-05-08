"use client"

import { useState } from "react"
import { Button } from "@medusajs/ui"
import { handleAddToCart } from "@modules/cart/utils"
import { Customer, Region } from "@medusajs/medusa"
import { useParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import QuantityInput from "@modules/products/components/quantity-input"

export default function ProductPreviewCartActions({
  variantId,
  region,
  handle,
  customer,
}: {
  variantId?: string
  region: Region
  handle: string | null
  customer: Omit<Customer, "password_hash"> | null
}) {
  if (!variantId || !handle) {
    return null
  }

  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const countryCode = useParams().countryCode as string

  // Get customer details and their approval status
  const isCustomerSignedIn = !!customer
  const isCustomerApproved = !!customer?.metadata?.approved

  return (
    <div className="flex items-center mt-2 space-x-2">
      {isCustomerSignedIn ? (
        isCustomerApproved ? (
          <>
            <div className="w-2/3">
              <QuantityInput
                initialQuantity={quantity}
                onUpdate={(newQuantity) => setQuantity(newQuantity)}
              />
            </div>
            <Button
              variant="primary"
              size="base"
              className="w-1/3 h-[40px] text-xs flex items-center justify-center whitespace-nowrap py-0"
              onClick={() =>
                handleAddToCart({
                  variantId,
                  quantity,
                  countryCode,
                  setIsAdding,
                })
              }
              disabled={isAdding}
              isLoading={isAdding}
            >
              Add to cart
            </Button>
          </>
        ) : (
          <LocalizedClientLink href="/contact" className="w-full">
            <Button
              variant="secondary"
              size="base"
              className="w-full h-[40px] text-xs whitespace-nowrap bg-white py-0"
            >
              Contact Us for Approval
            </Button>
          </LocalizedClientLink>
        )
      ) : (
        <LocalizedClientLink href="/account" className="w-full">
          <Button
            variant="secondary"
            size="base"
            className="w-full h-[40px] text-xs whitespace-nowrap bg-white py-0"
          >
            Sign In for Details
          </Button>
        </LocalizedClientLink>
      )}
    </div>
  )
}
