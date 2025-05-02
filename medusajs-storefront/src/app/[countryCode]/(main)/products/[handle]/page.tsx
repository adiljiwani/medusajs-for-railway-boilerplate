import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCustomer,
  getProductByHandle,
  getProductsList,
  getRegion,
  listRegions,
  retrievePricedProductById,
} from "@lib/data"
import { Region } from "@medusajs/medusa"
import { ProductPreviewType } from "types/global"
import ProductTemplate from "@modules/products/templates"

type Props = {
  params: { countryCode: string; handle: string }
}

export async function generateStaticParams() {
  try {
    const [regionsResult, products] = await Promise.all([
      listRegions().catch(() => []),
      getProductsList({ countryCode: "us" }).catch(() => ({ response: { products: [] } }))
    ])

    if (!regionsResult?.length) {
      return []
    }

    const countryCodes = regionsResult
      .map((r: Region) => r.countries.map((c: { iso_2: string }) => c.iso_2))
      .flat()
    
    if (!countryCodes.length || !products.response.products.length) {
      return []
    }

    return countryCodes.map((countryCode: string) =>
      products.response.products
        .filter((product: ProductPreviewType): product is ProductPreviewType & { handle: string } => 
          product.handle !== null
        )
        .map((product) => ({
          countryCode,
          handle: product.handle,
        }))
    ).flat()
  } catch (error) {
    // During build time, if API is not available, return empty array
    // Pages will be generated on-demand at runtime
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = params

  const { product } = await getProductByHandle(handle).then(
    (product) => product
  )

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | Batteries N' Things`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | Batteries N' Things`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

const getPricedProductByHandle = async (handle: string, region: Region) => {
  const { product } = await getProductByHandle(handle).then(
    (product) => product
  )

  if (!product || !product.id) {
    return null
  }

  const pricedProduct = await retrievePricedProductById({
    id: product.id,
    regionId: region.id,
  })

  return pricedProduct
}

export default async function ProductPage({ params }: Props) {
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await getPricedProductByHandle(params.handle, region)

  if (!pricedProduct) {
    notFound()
  }

  const customer = await getCustomer().catch(() => null)
  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      customer={customer}
    />
  )
}
