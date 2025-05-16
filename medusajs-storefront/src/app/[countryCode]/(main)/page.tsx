import { Customer, Product } from "@medusajs/medusa"
import BannerCarousel from "@modules/home/components/banner-carousel"
import { Metadata } from "next"
import InteractiveLink from "@modules/common/components/interactive-link"

import {
  getCollectionsList,
  getProductsList,
  getRegion,
  getCustomer,
} from "@lib/data"
import FeaturedProducts from "@modules/home/components/featured-products"
// import Hero from "@modules/home/components/hero"
import { ProductCollectionWithPreviews } from "types/global"
import { cache } from "react"

export const metadata: Metadata = {
  title: "Batteries N' Things",
  description:
    "Batteries N' Things provide wireless communication solutions, services and support within GTA and surrounding areas. Our stores have highly trained staff to provide customer friendly service.",
}

const banners = [
  {
    imageUrl: "/banner-1.png",
    linkUrl: "/",
    altText: "Banner",
  },
  {
    imageUrl: "/banner-2.png",
    linkUrl: "/",
    altText: "Banner",
  },
  {
    imageUrl: "/banner-3.png",
    linkUrl: "/",
    altText: "Banner",
  },
]

const getCollectionsWithProducts = cache(
  async (
    countryCode: string
  ): Promise<ProductCollectionWithPreviews[] | null> => {
    const { collections } = await getCollectionsList(0, 3)

    if (!collections) {
      return null
    }

    const collectionIds = collections.map((collection) => collection.id)

    await Promise.all(
      collectionIds.map((id) =>
        getProductsList({
          queryParams: { collection_id: [id] },
          countryCode,
        })
      )
    ).then((responses) =>
      responses.forEach(({ response, queryParams }) => {
        let collection

        if (collections) {
          collection = collections.find(
            (collection) => collection.id === queryParams?.collection_id?.[0]
          )
        }

        if (!collection) {
          return
        }

        collection.products = response.products as unknown as Product[]
      })
    )

    return collections as unknown as ProductCollectionWithPreviews[]
  }
)

const getCurrentCustomer = cache(
  async (): Promise<Omit<Customer, "password_hash"> | null> => {
    return await getCustomer().catch(() => null)
  }
)

export default async function Home({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)
  const customer = await getCurrentCustomer()

  if (!collections || !region) {
    return null
  }

  return (
    <>
      {/* <Hero /> */}
      <BannerCarousel banners={banners} />

      <div className="py-6">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts
            collections={collections}
            region={region}
            customer={customer}
          />
        </ul>
        <div className="content-container flex justify-center mt-8">
          <div className="text-lg font-bold">
            <InteractiveLink href="/store">
              Explore all products
            </InteractiveLink>
          </div>
        </div>
      </div>
    </>
  )
}
