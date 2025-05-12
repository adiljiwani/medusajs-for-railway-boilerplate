import { LineItem } from "@medusajs/medusa"

import { enrichLineItems, retrieveCart } from "@modules/cart/actions"

import CartDropdown from "../cart-dropdown"
import { getCustomer } from "@lib/data"

const fetchCart = async () => {
  const cart = await retrieveCart()

  if (cart?.items.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id)
    cart.items = enrichedItems as LineItem[]
  }

  return cart
}

export default async function CartButton() {
  const [cart, customer] = await Promise.all([
    fetchCart(),
    getCustomer().catch(() => null),
  ])

  return <CartDropdown cart={cart} customer={customer} />
}
