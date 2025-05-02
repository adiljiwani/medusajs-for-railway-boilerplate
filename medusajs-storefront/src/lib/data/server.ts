"use server"

import { cookies } from "next/headers"
import { medusaClient } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { StoreGetProductsParams } from "@medusajs/medusa"
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { ProductPreviewType } from "types/global"
import { Region } from "@medusajs/medusa"

const getMedusaHeaders = (tags: string[] = []) => {
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

export async function getRegionServer(countryCode: string): Promise<Region | null> {
  if (!countryCode) return null
  
  try {
    const { regions } = await medusaClient.regions.list()
    return regions.find((r) => r.countries.find((c) => c.iso_2 === countryCode)) || null
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching region:", error)
    }
    return null
  }
}

export async function getCustomer() {
  try {
    const headers = getMedusaHeaders(["customer"])
    const { customer } = await medusaClient.customers.retrieve(headers)
    return customer
  } catch (err) {
    return null
  }
}

export async function getCart() {
  try {
    const cartId = cookies().get("_medusa_cart_id")?.value
    if (!cartId) {
      return null
    }

    const headers = getMedusaHeaders(["cart"])
    const { cart } = await medusaClient.carts.retrieve(cartId, headers)
    return cart
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.log(err)
    }
    return null
  }
}

export async function getProductById(id: string, regionId: string) {
  if (!id) return null
  
  try {
    const { product } = await medusaClient.products.retrieve(id, { })
    return product
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching product:", error)
    }
    return null
  }
}

export async function getCollections() {
  try {
    const { collections } = await medusaClient.collections.list({ limit: 100 })
    return collections
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching collections:", error)
    }
    return []
  }
}

export async function getRelatedProducts(
  product: PricedProduct,
  countryCode: string
) {
  if (!product || !countryCode) return null
  
  const headers = getMedusaHeaders(["products"])
  const region = await getRegionServer(countryCode)

  if (!region) {
    return null
  }

  const params: StoreGetProductsParams = {}

  if (region?.id) {
    params.region_id = region.id
  }

  if (region?.currency_code) {
    params.currency_code = region.currency_code
  }

  if (product.collection_id) {
    params.collection_id = [product.collection_id]
  }

  if (product.tags) {
    params.tags = product.tags.map((t) => t.value)
  }

  params.is_giftcard = false

  try {
    const { products } = await medusaClient.products.list(params, headers)
    const filteredProducts = products.filter((p) => p.id !== product.id)
    
    const transformedProducts: ProductPreviewType[] = filteredProducts.map((p) => ({
      id: p.id || "",
      title: p.title || "",
      handle: p.handle || null,
      thumbnail: p.thumbnail || null,
      created_at: p.created_at,
      price: p.variants[0]?.prices[0] ? {
        calculated_price: p.variants[0].prices[0].amount.toString(),
        original_price: p.variants[0].prices[0].amount.toString(),
        difference: "0",
        price_type: "default"
      } : undefined
    }))

    return {
      products: transformedProducts,
      region
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching related products:", error)
    }
    return null
  }
} 