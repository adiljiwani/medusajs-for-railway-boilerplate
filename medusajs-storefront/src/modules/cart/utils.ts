import { addToCart } from "@modules/cart/actions"

export const handleAddToCart = async ({
  variantId,
  quantity,
  countryCode,
  setIsAdding,
}: {
  variantId: string
  quantity: number
  countryCode: string
  setIsAdding: (isAdding: boolean) => void
}) => {
  setIsAdding(true)

  try {
    await addToCart({
      variantId,
      quantity,
      countryCode,
    })
  } finally {
    setIsAdding(false)
  }
}
