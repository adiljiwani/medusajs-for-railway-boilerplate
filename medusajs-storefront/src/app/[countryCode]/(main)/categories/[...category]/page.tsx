import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories, listRegions, getCustomer } from "@lib/data"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { ProductCategory } from "@medusajs/medusa"

type Props = {
  params: { category: string[]; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions) =>
    regions?.map((r) => r.countries.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map((category: ProductCategory) => category.handle)

  const staticParams = countryCodes
    ?.map((countryCode) =>
      categoryHandles.map((handle: string) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()
    .filter(
      (param) =>
        param &&
        typeof param.countryCode === "string" &&
        param.countryCode.length > 0 &&
        Array.isArray(param.category) &&
        param.category.length > 0 &&
        typeof param.category[0] === "string" &&
        param.category[0].length > 0
    )

  return staticParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { product_categories } = await getCategoryByHandle(
      params.category
    ).then((product_categories) => product_categories)

    const title = product_categories
      .map((category) => category.name)
      .join(" | ")

    const description =
      product_categories[product_categories.length - 1].description ??
      `${title} category.`

    return {
      title: `${title} | Batteries N' Things`,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const { product_categories } = await getCategoryByHandle(
    params.category
  ).then((product_categories) => product_categories)

  if (!product_categories) {
    notFound()
  }

  const customer = await getCustomer()

  return (
    <CategoryTemplate
      categories={product_categories}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      customer={customer}
    />
  )
}
