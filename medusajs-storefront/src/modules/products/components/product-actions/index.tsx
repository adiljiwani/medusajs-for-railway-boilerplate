"use client"

import { Customer, Region } from "@medusajs/medusa"
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { Button } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/option-select"
import QuantityInput from "@modules/products/components/quantity-input"

import MobileActions from "../mobile-actions"
import ProductPrice from "../product-price"
import { handleAddToCart } from "@modules/cart/utils"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductActionsProps = {
  product: PricedProduct
  region: Region
  disabled?: boolean
  customer: Omit<Customer, "password_hash"> | null
}

export type PriceType = {
  calculated_price: string
  original_price?: string
  price_type?: "sale" | "default"
  percentage_diff?: string
}

export type ProductQuantityInfo = {
  available_quantity: number
}

export default function ProductActions({
  product,
  region,
  disabled,
  customer,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1) // State for quantity input

  const countryCode = useParams().countryCode as string

  const variants = product.variants

  // initialize the option state
  useEffect(() => {
    const optionObj: Record<string, string> = {}

    for (const option of product.options || []) {
      Object.assign(optionObj, { [option.id]: undefined })
    }

    setOptions(optionObj)
  }, [product])

  // memoized record of the product's variants
  const variantRecord = useMemo(() => {
    const map: Record<string, Record<string, string>> = {}

    for (const variant of variants) {
      if (!variant.options || !variant.id) continue

      const temp: Record<string, string> = {}

      for (const option of variant.options) {
        temp[option.option_id] = option.value
      }

      map[variant.id] = temp
    }

    return map
  }, [variants])

  // memoized function to check if the current options are a valid variant
  const variant = useMemo(() => {
    let variantId: string | undefined = undefined

    for (const key of Object.keys(variantRecord)) {
      if (isEqual(variantRecord[key], options)) {
        variantId = key
      }
    }

    return variants.find((v) => v.id === variantId)
  }, [options, variantRecord, variants])

  // if product only has one variant, then select it
  useEffect(() => {
    if (variants.length === 1 && variants[0].id) {
      setOptions(variantRecord[variants[0].id])
    }
  }, [variants, variantRecord])

  // update the options when a variant is selected
  const updateOptions = (update: Record<string, string>) => {
    setOptions({ ...options, ...update })
  }

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (variant && !variant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (variant && variant.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (variant?.inventory_quantity && variant.inventory_quantity > 0) {
      return true
    }

    // Otherwise, we can't add to cart
    return true
  }, [variant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCartClick = async () => {
    if (!variant?.id) return null
    await handleAddToCart({
      variantId: variant.id,
      quantity, // Pass the user-specified quantity
      countryCode,
      setIsAdding,
    })
  }

  // Get customer details and their approval status
  const isCustomerSignedIn = !!customer
  const isCustomerApproved = !!customer?.metadata?.approved

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {product.variants.length > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => (
                <div key={option.id}>
                  <OptionSelect
                    option={option}
                    current={options[option.id]}
                    updateOption={updateOptions}
                    title={option.title}
                    data-testid="product-options"
                    disabled={!!disabled || isAdding}
                  />
                </div>
              ))}
              <Divider />
            </div>
          )}
        </div>

        {isCustomerSignedIn ? (
          isCustomerApproved ? (
            <>
              <ProductPrice
                product={product}
                variant={variant}
                region={region}
              />

              <QuantityInput
                initialQuantity={quantity}
                onUpdate={(newQuantity) => setQuantity(newQuantity)}
              />

              <Button
                onClick={handleAddToCartClick}
                disabled={!inStock || !variant || !!disabled || isAdding}
                variant="primary"
                className="w-full h-10"
                isLoading={isAdding}
                data-testid="add-product-button"
              >
                {!variant
                  ? "Select variant"
                  : !inStock
                  ? "Out of stock"
                  : "Add to cart"}
              </Button>
            </>
          ) : (
            <LocalizedClientLink href="/contact">
              <Button
                variant="danger"
                size="base"
                className="w-full h-10 whitespace-nowrap"
              >
                Contact Us for Approval
              </Button>
            </LocalizedClientLink>
          )
        ) : (
          <LocalizedClientLink href="/account">
            <Button
              variant="danger"
              size="base"
              className="w-full h-10 whitespace-nowrap"
            >
              Sign In to See Price
            </Button>
          </LocalizedClientLink>
        )}
        <MobileActions
          product={product}
          variant={variant}
          region={region}
          options={options}
          updateOptions={updateOptions}
          inStock={inStock}
          handleAddToCart={handleAddToCartClick}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
