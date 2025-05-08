"use client"

import { Input } from "@medusajs/ui"
import { useState } from "react"

type QuantityInputProps = {
  initialQuantity: number
  onUpdate: (quantity: number) => void
}

const QuantityInput = ({ initialQuantity, onUpdate }: QuantityInputProps) => {
  const [quantity, setQuantity] = useState(String(initialQuantity))

  const handleBlur = () => {
    const parsedQuantity = parseInt(quantity, 10)

    // Only update if the parsed quantity is valid and different from the initial one
    if (
      !isNaN(parsedQuantity) &&
      parsedQuantity >= 0 &&
      parsedQuantity !== initialQuantity
    ) {
      onUpdate(parsedQuantity)
    } else {
      setQuantity(String(initialQuantity)) // Revert if invalid or unchanged
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    if (/^\d*$/.test(value)) { // Allow only digits
      setQuantity(value)
    }
  }

  return (
    <Input
      type="text"
      value={quantity}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-full h-[40px] p-2 text-sm"
      aria-label="Quantity"
      data-testid="product-quantity-input"
    />
  )
}

export default QuantityInput
