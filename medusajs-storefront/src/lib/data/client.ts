"use client"

import { Region, StoreGetProductsParams } from "@medusajs/medusa"
import { medusaClient } from "@lib/config"
import { ProductPreviewType } from "types/global"
import sortProducts from "@lib/util/sort-products"
import transformProductPreview from "@lib/util/transform-product-preview"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

/**
 * Client-side version of getRegion that doesn't use server components
 */
export async function getRegion(countryCode: string): Promise<Region | null> {
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

/**
 * Client-side version of retrievePricedProductById that doesn't use server components
 */
export async function retrievePricedProductById({
  id,
  regionId,
}: {
  id: string
  regionId: string
}) {
  if (!id || !regionId) return null
  
  try {
    const { product } = await medusaClient.products.retrieve(id, {
      region_id: regionId,
    })
    return product
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching product:", error)
    }
    return null
  }
}

/**
 * Client-side version of getProductsList that doesn't use server components
 */
export async function getProductsList({
  pageParam = 0,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: StoreGetProductsParams
  countryCode: string
}): Promise<{
  response: { products: ProductPreviewType[]; count: number }
  nextPage: number | null
  queryParams?: StoreGetProductsParams
}> {
  const limit = queryParams?.limit || 12

  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }
  }

  try {
    const { products, count } = await medusaClient.products.list({
      limit,
      offset: pageParam,
      region_id: region.id,
      ...queryParams,
    })

    const transformedProducts = products.map((product) => {
      return transformProductPreview(product, region)
    })

    const nextPage = pageParam + limit < count ? pageParam + limit : null

    return {
      response: { products: transformedProducts, count },
      nextPage,
      queryParams,
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching products:", error)
    }
    return {
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }
  }
}

/**
 * Client-side version of getProductsListWithSort that doesn't use server components
 */
export async function getProductsListWithSort({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: StoreGetProductsParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: ProductPreviewType[]; count: number }
  nextPage: number | null
  queryParams?: StoreGetProductsParams
}> {
  const PRODUCTS_PER_PAGE = 50
  const limit = queryParams?.limit || PRODUCTS_PER_PAGE
  const offset = queryParams?.id ? 0 : (page - 1) * limit

  const {
    response: { products, count },
  } = await getProductsList({
    pageParam: offset,
    queryParams: {
      ...queryParams,
      limit: queryParams?.id ? queryParams.id.length : limit,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const nextPage = queryParams?.id ? null : (offset + limit < count ? page + 1 : null)

  return {
    response: {
      products: sortedProducts,
      count: queryParams?.id ? products.length : count,
    },
    nextPage,
    queryParams,
  }
}

export async function getCustomerData() {
  try {
    const { customer } = await medusaClient.customers.retrieve()
    return customer
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching customer:", error)
    }
    return null
  }
} 