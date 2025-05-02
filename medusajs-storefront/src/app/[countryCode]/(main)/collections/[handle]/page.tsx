import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCollectionByHandle,
  getCollectionsList,
  listRegions,
  getCustomer,
} from "@lib/data"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: { handle: string; countryCode: string }
  searchParams: {
    page?: string
    sortBy?: SortOptions
  }
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  try {
    const [{ collections }, regions] = await Promise.all([
      getCollectionsList().catch(() => ({ collections: [] })),
      listRegions().catch(() => [])
    ])

    if (!collections?.length || !regions?.length) {
      return []
    }

    const countryCodes = regions.map((r) => r.countries.map((c) => c.iso_2)).flat()
    const collectionHandles = collections.map((collection) => collection.handle)

    return countryCodes.map((countryCode) =>
      collectionHandles.map((handle) => ({
        countryCode,
        handle,
      }))
    ).flat()
  } catch (error) {
    // During build time, if API is not available, return empty array
    // Pages will be generated on-demand at runtime
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const metadata = {
    title: `${collection.title} | Batteries N' Things`,
    description: `${collection.title} collection`,
  } as Metadata

  return metadata
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const [collection, customer] = await Promise.all([
    getCollectionByHandle(params.handle).then((collection) => collection),
    getCustomer().catch(() => null),
  ])

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
      customer={customer}
    />
  )
}
