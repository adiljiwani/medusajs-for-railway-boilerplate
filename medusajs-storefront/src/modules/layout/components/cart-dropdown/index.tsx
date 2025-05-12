"use client"

import { Popover, Transition } from "@headlessui/react"
import { Cart } from "@medusajs/medusa"
import { Customer } from "@medusajs/medusa"
import { Button } from "@medusajs/ui"
import { useParams, usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

import { formatAmount } from "@lib/util/prices"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { ShoppingCartIcon } from "@heroicons/react/24/outline"

interface CartDropdownProps {
  cart?: Omit<Cart, "beforeInsert" | "afterLoad"> | null
  customer: Omit<Customer, "password_hash"> | null
}

const CartDropdown = ({ cart: cartState, customer }: CartDropdownProps) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const { countryCode } = useParams()

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  // Get customer details and their approval status
  const isCustomerSignedIn = !!customer
  const isCustomerApproved = !!customer?.metadata?.approved

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <Popover.Button className="h-full">
          <LocalizedClientLink
            className="hover:text-ui-fg-base"
            href="/cart"
            data-testid="nav-cart-link"
          >
            <ShoppingCartIcon className="h-6 w-6 text-gray-500 relative" />
            {/* Dyanamic width and font size for the bubble, based on the number of items in the cart */}
            {isCustomerSignedIn && isCustomerApproved && totalItems > 0 && (
              <div
                className={`absolute top-1/4 left-5 transform -translate-x-1/4 -translate-y-1/4 bg-gray-500 text-white rounded-full h-5 flex items-center justify-center ${
                  totalItems > 999
                    ? "w-8 text-[0.625rem]" // 4 or more digits
                    : totalItems > 99
                    ? "w-6 text-[0.625rem]" // 3 digits
                    : "w-5 text-[0.625rem]" // 2 or less digits
                }`}
              >
                {totalItems}
              </div>
            )}
          </LocalizedClientLink>
        </Popover.Button>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-white border-x border-b border-gray-200 w-[420px] text-ui-fg-base"
            data-testid="nav-cart-dropdown"
          >
            <div className="p-4 flex items-center justify-center">
              <h3 className="text-large-semi">Cart</h3>
            </div>
            {isCustomerSignedIn ? (
              isCustomerApproved ? (
                cartState && cartState.items?.length ? (
                  <>
                    <div className="overflow-y-scroll max-h-[402px] px-4 grid grid-cols-1 gap-y-8 no-scrollbar p-px">
                      {cartState.items
                        .sort((a, b) => {
                          return a.created_at > b.created_at ? -1 : 1
                        })
                        .map((item) => (
                          <div
                            className="grid grid-cols-[122px_1fr] gap-x-4"
                            key={item.id}
                            data-testid="cart-item"
                          >
                            <LocalizedClientLink
                              href={`/products/${item.variant.product.handle}`}
                              className="w-24"
                            >
                              <Thumbnail
                                thumbnail={item.thumbnail}
                                size="square"
                              />
                            </LocalizedClientLink>

                            <div className="flex flex-col justify-between flex-1 min-w-0">
                              <div className="flex flex-col flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex flex-col overflow-hidden whitespace-nowrap mr-4 w-[180px]">
                                    <h3
                                      className="text-base-regular overflow-hidden text-ellipsis whitespace-nowrap"
                                      data-testid="product-link"
                                    >
                                      <LocalizedClientLink
                                        href={`/products/${item.variant.product.handle}`}
                                      >
                                        {item.title}
                                      </LocalizedClientLink>
                                    </h3>
                                    <LineItemOptions
                                      variant={item.variant}
                                      data-testid="cart-item-variant"
                                      data-value={item.variant}
                                    />
                                    <span
                                      data-testid="cart-item-quantity"
                                      data-value={item.quantity}
                                    >
                                      Quantity: {item.quantity}
                                    </span>
                                  </div>

                                  <div className="flex justify-end flex-shrink-0">
                                    <LineItemPrice
                                      region={cartState.region}
                                      item={item}
                                      style="tight"
                                    />
                                  </div>
                                </div>
                              </div>
                              <DeleteButton
                                id={item.id}
                                className="mt-1"
                                data-testid="cart-item-remove-button"
                              >
                                Remove
                              </DeleteButton>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="p-4 flex flex-col gap-y-4 text-small-regular">
                      <div className="flex items-center justify-between">
                        <span className="text-ui-fg-base font-semibold">
                          Subtotal{" "}
                          <span className="font-normal">(excl. taxes)</span>
                        </span>
                        <span
                          className="text-large-semi"
                          data-testid="cart-subtotal"
                          data-value={cartState.subtotal || 0}
                        >
                          {formatAmount({
                            amount: cartState.subtotal || 0,
                            region: cartState.region,
                            includeTaxes: false,
                          })}
                        </span>
                      </div>
                      <LocalizedClientLink href="/cart" passHref>
                        <Button
                          className="w-full"
                          size="large"
                          data-testid="go-to-cart-button"
                        >
                          Go to cart
                        </Button>
                      </LocalizedClientLink>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                      <div className="bg-gray-900 text-small-regular flex items-center justify-center w-6 h-6 rounded-full text-white">
                        <span>0</span>
                      </div>
                      <span>Your shopping bag is empty.</span>
                      <div>
                        <LocalizedClientLink href="/store">
                          <>
                            <span className="sr-only">
                              Go to all products page
                            </span>
                            <Button onClick={close}>Explore products</Button>
                          </>
                        </LocalizedClientLink>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                    <span>
                      Your account status is set to <strong>unapproved</strong>.
                      <br />
                      Please get in touch with us to change this.
                    </span>
                    <div>
                      <LocalizedClientLink href="/contact">
                        <>
                          <span className="sr-only">Go to contact page</span>
                          <Button onClick={close}>Contact Us</Button>
                        </>
                      </LocalizedClientLink>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                  <span>Sign in to add products to the cart</span>
                  <div>
                    <LocalizedClientLink href="/account">
                      <>
                        <span className="sr-only">Go to account page</span>
                        <Button onClick={close}>Sign in</Button>
                      </>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
