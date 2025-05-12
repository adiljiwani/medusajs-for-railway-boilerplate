import { Metadata } from "next"

import SearchResultsTemplate from "@modules/search/templates/search-results-template"

import { search } from "@modules/search/actions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getCustomer } from "@lib/data"
import { getProductsListWithSort } from "@lib/data"

// Add dynamic route configuration
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Search",
  description: "Explore all of our products.",
}

type SearchParams = {
  sortBy?: SortOptions
  page?: string
  category_id?: string
  subcategory_id?: string
  include?: {
    category_id?: string[]
    subcategory_id?: string[]
  }
  exclude?: {
    category_id?: string[]
    subcategory_id?: string[]
  }
  'exclude.category_id'?: string | string[]
  'exclude.subcategory_id'?: string | string[]
  'include.category_id'?: string | string[]
  'include.subcategory_id'?: string | string[]
  searchByTitle?: string
  [key: string]: any // Allow for dynamic bracket notation keys
}

type Params = {
  params: { query: string; countryCode: string }
  searchParams: SearchParams
}

export default async function SearchResults({ params, searchParams }: Params) {
  const { query } = params
  const { sortBy, page, category_id, subcategory_id, searchByTitle } = searchParams
  
  const customer = await getCustomer().catch(() => null)

  // Decode the query parameter
  const decodedQuery = decodeURIComponent(query)
  
  // Parse exclude parameters from URL, handling bracket notation
  const exclude = {
    category_id: undefined as string[] | undefined,
    subcategory_id: undefined as string[] | undefined
  }

  // Handle bracket notation format
  Object.keys(searchParams).forEach(key => {
    if (key.startsWith('exclude[category_id]')) {
      if (!exclude.category_id) exclude.category_id = []
      exclude.category_id.push(searchParams[key])
    }
    if (key.startsWith('exclude[subcategory_id]')) {
      if (!exclude.subcategory_id) exclude.subcategory_id = []
      exclude.subcategory_id.push(searchParams[key])
    }
  })

  // Handle dot notation format as fallback
  if (!exclude.category_id) {
    const rawExcludeCategoryId = searchParams['exclude.category_id'] || searchParams.exclude?.category_id
    if (rawExcludeCategoryId) {
      exclude.category_id = Array.isArray(rawExcludeCategoryId) ? rawExcludeCategoryId : [rawExcludeCategoryId]
    }
  }
  if (!exclude.subcategory_id) {
    const rawExcludeSubcategoryId = searchParams['exclude.subcategory_id'] || searchParams.exclude?.subcategory_id
    if (rawExcludeSubcategoryId) {
      exclude.subcategory_id = Array.isArray(rawExcludeSubcategoryId) ? rawExcludeSubcategoryId : [rawExcludeSubcategoryId]
    }
  }

  // Parse include parameters similarly
  const include = {
    category_id: undefined as string[] | undefined,
    subcategory_id: undefined as string[] | undefined
  }

  Object.keys(searchParams).forEach(key => {
    if (key.startsWith('include[category_id]')) {
      if (!include.category_id) include.category_id = []
      include.category_id.push(searchParams[key])
    }
    if (key.startsWith('include[subcategory_id]')) {
      if (!include.subcategory_id) include.subcategory_id = []
      include.subcategory_id.push(searchParams[key])
    }
  })

  if (!include.category_id) {
    const rawIncludeCategoryId = searchParams['include.category_id'] || searchParams.include?.category_id
    if (rawIncludeCategoryId) {
      include.category_id = Array.isArray(rawIncludeCategoryId) ? rawIncludeCategoryId : [rawIncludeCategoryId]
    }
  }
  if (!include.subcategory_id) {
    const rawIncludeSubcategoryId = searchParams['include.subcategory_id'] || searchParams.include?.subcategory_id
    if (rawIncludeSubcategoryId) {
      include.subcategory_id = Array.isArray(rawIncludeSubcategoryId) ? rawIncludeSubcategoryId : [rawIncludeSubcategoryId]
    }
  }

  console.log("[Search] Raw search params:", searchParams)
  console.log("[Search] searchByTitle param:", searchByTitle)
  console.log("[Search] Query before processing:", `"${decodedQuery}"`)
  console.log("[Search] Include filters:", include)
  console.log("[Search] Exclude filters:", exclude)
  
  // Get the current page number from the URL or default to 1
  const currentPage = page ? parseInt(page) : 1
  const PRODUCTS_PER_PAGE = 50
  
  console.log("[Search] Starting search with page:", currentPage)
  
  // Get all search results with filters
  const shouldSearchByTitle = searchByTitle !== 'false';
  console.log("[Search] Should search by title:", shouldSearchByTitle);
  console.log("[Search] Final query to be used:", decodedQuery);
  
  // Get all results from Algolia
  const searchResults = await search(
    decodedQuery,
    false,
    {
      category_id,
      subcategory_id,
      include: include.category_id || include.subcategory_id ? include : undefined,
      exclude: exclude.category_id || exclude.subcategory_id ? exclude : undefined,
      searchByTitle: shouldSearchByTitle
    }
  )

  // First, get all products from Medusa
  const {
    response: { products: allProducts },
  } = await getProductsListWithSort({
    page: 1,
    queryParams: { 
      id: searchResults.hits.map(hit => hit.id), // Get ALL products from search results
      limit: searchResults.hits.length
    },
    sortBy, // Apply the sort to all products
    countryCode: params.countryCode,
  })

  // Calculate pagination after sorting
  const totalHits = allProducts.length
  const totalPages = Math.ceil(totalHits / PRODUCTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const endIndex = Math.min(startIndex + PRODUCTS_PER_PAGE, totalHits)
  
  // Get products for the current page from the sorted results
  const currentPageProducts = allProducts.slice(startIndex, endIndex)
  const currentPageIds = currentPageProducts.map(product => product.id)
  
  console.log("[Search] Pagination info:")
  console.log(`- Total search results from Algolia: ${searchResults.totalHits}`)
  console.log(`- Total products after sorting: ${totalHits}`)
  console.log(`- Items on current page: ${currentPageProducts.length}`)
  console.log(`- Product IDs on current page:`, currentPageIds)
  console.log(`- Next page: ${currentPage < totalPages ? currentPage + 1 : null}`)
  
  if (sortBy) {
    console.log("[Search] Sort info:")
    console.log(`- Sort by: ${sortBy}`)
    console.log(`- First product price: ${currentPageProducts[0]?.price?.calculated_price}`)
    console.log(`- Last product price: ${currentPageProducts[currentPageProducts.length - 1]?.price?.calculated_price}`)
  }
  
  return (
    <SearchResultsTemplate
      query={query}
      ids={currentPageIds}
      sortBy={sortBy}
      page={currentPage.toString()}
      countryCode={params.countryCode}
      customer={customer}
      totalHits={totalHits}
      totalPages={totalPages}
      category_id={category_id}
      subcategory_id={subcategory_id}
    />
  )
}
