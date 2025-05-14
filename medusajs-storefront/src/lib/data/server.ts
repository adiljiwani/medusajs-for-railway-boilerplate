"use server"

import { cookies } from "next/headers"
import { medusaClient } from "@lib/config"

export const getMedusaHeaders = (tags: string[] = []) => {
  const headers = {
    next: {
      tags,
    },
  } as Record<string, any>

  const token = cookies().get("_medusa_jwt")?.value

  if (token) {
    headers.authorization = `Bearer ${token}`
  } else {
    headers.authorization = ""
  }

  return headers
}

export async function getCustomer() {
  const headers = getMedusaHeaders(["customer"])

  return medusaClient.customers
    .retrieve(headers)
    .then(({ customer }) => customer)
    .catch(() => null)
}

export async function retrieveCart() {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts
    .retrieve(cookies().get("_medusa_cart_id")?.value || "", headers)
    .then(({ cart }) => cart)
    .catch(() => null)
} 