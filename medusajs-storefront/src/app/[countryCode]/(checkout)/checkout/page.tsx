import { Metadata } from "next"
import { notFound } from "next/navigation"

import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { loadCheckoutData } from "./data"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const data = await loadCheckoutData()

  if (!data) {
    return notFound()
  }
  
  const { cart, availableShippingMethods, customer } = data

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <Wrapper cart={cart}>
        <CheckoutForm 
          cart={cart}
          availableShippingMethods={availableShippingMethods}
          customer={customer}
        />
      </Wrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
