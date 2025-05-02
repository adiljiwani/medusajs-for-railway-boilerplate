import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories, listRegions } from "@lib/data"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: { category: string[]; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export async function generateStaticParams() {
  try {
    const [{ product_categories }, regions] = await Promise.all([
      listCategories().catch(() => []),
      listRegions().catch(() => [])
    ])

    // Safely extract country codes, filtering out any undefined values
    const countryCodes = (regions || [])
      .flatMap((r: { countries: { iso_2: string }[] }) => r.countries.map(c => c.iso_2))
      .filter(Boolean); // Remove any undefined/null values
    
    // If we don't have any valid country codes, return empty array
    if (!countryCodes.length) {
      return []
    }

    // Safely extract category handles, filtering out any undefined values
    const categoryHandles = product_categories
      .map((category: { handle: string }) => category?.handle)
      .filter(Boolean); // Remove any undefined/null values

    // If we don't have any valid category handles, return empty array
    if (!categoryHandles.length) {
      return []
    }

    // Build paths with explicit string conversion to avoid any undefined issues
    return countryCodes.map(countryCode => 
      categoryHandles.map((handle: string) => ({
        countryCode: String(countryCode),
        category: [String(handle)]
      }))
    ).flat()
  } catch (error) {
    // During build time, if API is not available, return empty array
    // Pages will be generated on-demand at runtime
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = params

  const categoryName = category[category.length - 1]

  return {
    title: `${categoryName} | Batteries N' Things`,
    description: `${categoryName} category`,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: categoryHandles, countryCode } = params
  const { sortBy, page } = searchParams

  // Get all categories
  const categories = []
  
  // Handle each category param and build the categories array
  for (const handle of categoryHandles) {
    const category = await getCategoryByHandle(handle)
    
    if (!category) {
      notFound()
    }
    
    categories.push(category)
  }

  if (!categories.length) {
    notFound()
  }

  return (
    <CategoryTemplate
      categories={categories}
      sortBy={sortBy}
      page={page}
      countryCode={countryCode}
    />
  )
}
