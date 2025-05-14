"use client"

import { LineItem } from "@medusajs/medusa"
import CartDropdown from "../cart-dropdown"
import { Customer } from "@medusajs/medusa"

interface CartButtonProps {
  cart: any
  customer: Omit<Customer, "password_hash"> | null
}

export default function CartButton({ cart, customer }: CartButtonProps) {
  return <CartDropdown cart={cart} customer={customer} />
}
