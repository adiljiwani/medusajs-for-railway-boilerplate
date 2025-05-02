import { cookies } from "next/headers"
import { LineItem } from "@medusajs/medusa"
import { notFound } from "next/navigation"

import { 
  createPaymentSessions, 
  getCart, 
  getCustomer,
  listCartShippingMethods, 
} from "@lib/data"
import { getCheckoutStep } from "@lib/util/get-checkout-step"
import { CartWithCheckoutStep } from "types/global"
import { enrichLineItems } from "@modules/cart/actions"

export async function loadCheckoutData() {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) {
    return null
  }

  // Get cart
  const cart = await getCart(cartId)
  
  if (!cart) {
    return null
  }

  // Enrich cart items
  if (cart?.items.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id)
    cart.items = enrichedItems as LineItem[]
  }
  
  // Create payment sessions
  const cartWithPayments = await createPaymentSessions(cartId)
  
  if (!cartWithPayments) {
    return null
  }
  
  // Add checkout step
  const cartWithStep = cartWithPayments as CartWithCheckoutStep
  cartWithStep.checkout_step = getCheckoutStep(cartWithStep)
  
  // Get shipping methods
  const shippingMethods = await listCartShippingMethods(cartId)
  const availableShippingMethods = shippingMethods?.filter(m => !m.is_return) || []
  
  // Get customer
  const customer = await getCustomer()
  
  return {
    cart: cartWithStep,
    availableShippingMethods,
    customer
  }
} 