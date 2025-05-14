import { getCustomer, listCategories, listUnlockedPhones, listBrands, listDevices } from "@lib/data"
import { enrichLineItems, retrieveCart } from "@modules/cart/actions"
import Header from "./index"
import { LineItem } from "@medusajs/medusa"

export default async function HeaderWrapper() {
  const [customer, categories, unlockedPhones, brands, devices, cart] = await Promise.all([
    getCustomer().catch(() => null),
    listCategories(),
    listUnlockedPhones(),
    listBrands(),
    listDevices(),
    retrieveCart()
  ])

  let enrichedCart = cart
  if (cart?.items.length) {
    const enrichedItems = await enrichLineItems(cart.items, cart.region_id)
    enrichedCart = {
      ...cart,
      items: enrichedItems as LineItem[]
    }
  }

  return (
    <Header 
      customer={customer}
      categories={categories}
      unlockedPhones={unlockedPhones}
      brands={brands}
      devices={devices}
      cart={enrichedCart}
    />
  )
} 