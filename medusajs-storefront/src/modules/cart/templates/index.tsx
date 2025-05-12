import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import { CartWithCheckoutStep } from "types/global"
import SignInPrompt from "../components/sign-in-prompt"
import { Customer } from "@medusajs/medusa"
import UnapprovedCustomerPrompt from "../components/unapproved-customer-message"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: CartWithCheckoutStep | null
  customer: Omit<Customer, "password_hash"> | null
}) => {
  // Get customer details and their approval status
  const isCustomerSignedIn = !!customer
  const isCustomerApproved = !!customer?.metadata?.approved

  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {isCustomerSignedIn ? (
          isCustomerApproved ? (
            <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
              <div className="flex flex-col bg-white py-6 gap-y-6">
                {cart?.items.length ? (
                  <ItemsTemplate region={cart?.region} items={cart?.items} />
                ) : (
                  <EmptyCartMessage />
                )}
              </div>

              <div className="relative">
                <div className="flex flex-col gap-y-8 sticky top-12">
                  {cart && cart.region && (
                    <>
                      <div className="bg-white py-6">
                        <Summary cart={cart} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <UnapprovedCustomerPrompt />
          )
        ) : (
          <SignInPrompt />
        )}
      </div>
    </div>
  )
}

export default CartTemplate
