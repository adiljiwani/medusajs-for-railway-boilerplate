"use client"

import { Suspense, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartDropdownWrapper from "@modules/layout/components/cart-dropdown/cart-dropdown-wrapper"
import { MagnifyingGlassIcon, UserIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid"
import { ShoppingCartIcon } from "@heroicons/react/24/outline"
import HeaderDropdowns from "@modules/layout/templates/header/header-dropdowns"
import {
  listCategories,
  listUnlockedPhones,
  listBrands,
  listDevices,
} from "@lib/data"
import { Customer, Cart } from "@medusajs/medusa"
import CustomerApprovalBanner from "@modules/layout/templates/header/customer-approval-banner"
import { DropdownOption } from "types/global"

interface HeaderProps {
  customer: Omit<Customer, "password_hash"> | null
  categories: DropdownOption[]
  unlockedPhones: DropdownOption[]
  brands: DropdownOption[]
  devices: DropdownOption[]
  cart: Omit<Cart, "beforeInsert" | "afterLoad"> | null
}

export default function Header({ customer, categories, unlockedPhones, brands, devices, cart }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative mx-auto border-b duration-200 bg-white border-ui-border-base shadow-sm">
        {/* Main header section */}
        <div className="content-container py-2">
          <div className="flex items-center justify-between">
            {/* Mobile menu button - only visible on small screens */}
            <div className="lg:hidden">
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Logo - centered on mobile, left-aligned on desktop */}
            <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
              <LocalizedClientLink href="/" className="h-12">
                <img
                  src="/logo.png"
                  style={{ cursor: "pointer" }}
                  alt="Batteries N' Things Logo"
                  className="h-full object-contain"
                />
              </LocalizedClientLink>
            </div>

            {/* Navigation items - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-x-6 h-full flex-1 justify-center">
              <HeaderDropdowns
                categories={categories}
                unlockedPhones={unlockedPhones}
                brands={brands}
                devices={devices}
              />
            </div>

            {/* Search, Account, Cart - always visible */}
            <div className="flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base flex"
                href="/account"
                data-testid="nav-account-link"
              >
                <UserIcon className="h-6 w-6 text-gray-500" />
              </LocalizedClientLink>

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
                <CartDropdownWrapper cart={cart} customer={customer} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Mobile navigation - shown when menu is open */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="content-container py-4">
              <HeaderDropdowns
                categories={categories}
                unlockedPhones={unlockedPhones}
                brands={brands}
                devices={devices}
              />
            </div>
          </div>
        )}
      </header>

      {customer && !customer.metadata?.approved && <CustomerApprovalBanner />}
    </div>
  )
}
