import { Cart } from "@medusajs/medusa"
import { Customer } from "@medusajs/medusa"
import CartDropdown from "."

interface CartDropdownWrapperProps {
  cart?: Omit<Cart, "beforeInsert" | "afterLoad"> | null
  customer: Omit<Customer, "password_hash"> | null
}

export default function CartDropdownWrapper({ cart, customer }: CartDropdownWrapperProps) {
  return <CartDropdown cart={cart} customer={customer} />
} 