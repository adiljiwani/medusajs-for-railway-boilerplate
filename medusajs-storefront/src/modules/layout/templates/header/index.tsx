import { Suspense } from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import { MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/solid"
import { ShoppingCartIcon } from "@heroicons/react/24/outline"
import HeaderDropdowns from "@modules/layout/templates/header/header-dropdowns"
import { Customer } from "@medusajs/medusa"
import CustomerApprovalBanner from "@modules/layout/templates/header/customer-approval-banner"

interface HeaderProps {
  customer: Omit<Customer, "password_hash"> | null
  categories: any[] // Replace with proper type
  unlockedPhones: any[] // Replace with proper type
  brands: any[] // Replace with proper type
  devices: any[] // Replace with proper type
}

export default function Header({ 
  customer, 
  categories, 
  unlockedPhones, 
  brands, 
  devices 
}: HeaderProps) {
  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base shadow-sm">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <LocalizedClientLink href="/" className="h-full">
                <img
                  src="/logo.png"
                  style={{ cursor: "pointer" }}
                  alt="Batteries N' Things Logo"
                  className="h-full object-contain"
                />
              </LocalizedClientLink>
            </div>
          </div>

          <HeaderDropdowns
            categories={categories}
            unlockedPhones={unlockedPhones}
            brands={brands}
            devices={devices}
          />

          <div className="flex items-center gap-x-6 h-full flex-1 justify-end">
            <div className="flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/search"
                data-testid="nav-search-link"
              >
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-500" />
              </LocalizedClientLink>

              <LocalizedClientLink
                className="hover:text-ui-fg-base flex"
                href="/account"
                data-testid="nav-account-link"
              >
                <UserIcon className="h-6 w-6 text-gray-500" />
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex items-center"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <ShoppingCartIcon className="h-6 w-6 text-gray-500 relative" />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>

      {customer && !customer.metadata?.approved && <CustomerApprovalBanner />}
    </div>
  )
}
