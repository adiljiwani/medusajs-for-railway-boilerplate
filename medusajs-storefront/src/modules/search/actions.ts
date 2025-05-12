"use server"

import { SEARCH_INDEX_NAME, searchClient } from "@lib/search-client"
import { FilterConfig } from "types/global"

interface AlgoliaHit {
  readonly objectID: string
  id: string
  title: string
  [x: string | number | symbol]: unknown
}

/**
 * Uses Algolia to search for a query
 * @param {string} query - search query
 * @param {boolean} isPreview - whether this is a preview search (typing in search bar)
 * @param {object} filters - optional filters for the search
 * @param {string} filters.category_id - category ID to filter by
 * @param {string} filters.subcategory_id - subcategory ID to filter by
 * @param {FilterConfig} filters.include - categories and subcategories to include
 * @param {FilterConfig} filters.exclude - categories and subcategories to exclude
 * @param {boolean|string} filters.searchByTitle - whether to search by title
 * @param {number} filters.page - page number for pagination
 */
export async function search(
  query: string,
  isPreview: boolean = false,
  filters?: {
    category_id?: string
    subcategory_id?: string
    include?: FilterConfig
    exclude?: FilterConfig
    searchByTitle?: boolean | string
    page?: number
  }
) {
  // Initialize Algolia index
  const index = searchClient.initIndex(SEARCH_INDEX_NAME)
  
  // Parse searchByTitle from string to boolean if needed
  let shouldSearchByTitle = true // default to true for backward compatibility
  if (filters?.searchByTitle === false || (typeof filters?.searchByTitle === 'string' && filters.searchByTitle.toLowerCase() === 'false')) {
    shouldSearchByTitle = false
  }
  
  console.log("[Algolia Debug] Raw searchByTitle:", filters?.searchByTitle)
  console.log("[Algolia Debug] Should search by title:", shouldSearchByTitle)
  
  // If not searching by title, use "*" to match all documents
  const searchQuery = shouldSearchByTitle ? query.trim() : "*"
  
  console.log("[Algolia Debug] Raw query:", query)
  console.log("[Algolia Debug] Final search query:", searchQuery)
  
  // Build facet filters array
  const facetFilters: string[][] = []
  
  if (filters) {
    // Handle basic category and subcategory filters
    if (filters.category_id) {
      facetFilters.push([`category_id:${filters.category_id}`])
    }
    if (filters.subcategory_id) {
      facetFilters.push([`subcategory_id:${filters.subcategory_id}`])
    }

    // Handle include filters
    if (filters.include) {
      if (filters.include.category_id?.length) {
        const categoryFilters = filters.include.category_id.map(id => `category_id:${id}`)
        if (categoryFilters.length > 0) {
          facetFilters.push(categoryFilters)
        }
      }
      if (filters.include.subcategory_id?.length) {
        const subcategoryFilters = filters.include.subcategory_id.map(id => `subcategory_id:${id}`)
        if (subcategoryFilters.length > 0) {
          facetFilters.push(subcategoryFilters)
        }
      }
    }

    // Handle exclude filters
    if (filters.exclude) {
      const excludeCategoryIds = filters.exclude.category_id ? 
        (Array.isArray(filters.exclude.category_id) ? filters.exclude.category_id : [filters.exclude.category_id]) : []
      const excludeSubcategoryIds = filters.exclude.subcategory_id ?
        (Array.isArray(filters.exclude.subcategory_id) ? filters.exclude.subcategory_id : [filters.exclude.subcategory_id]) : []

      if (excludeCategoryIds.length > 0) {
        excludeCategoryIds.forEach(id => {
          facetFilters.push([`NOT category_id:${id}`])
        })
      }
      if (excludeSubcategoryIds.length > 0) {
        excludeSubcategoryIds.forEach(id => {
          facetFilters.push([`NOT subcategory_id:${id}`])
        })
      }
    }
  }
  
  // Prepare search parameters - fetch all results at once
  const searchParams = {
    hitsPerPage: 1000, // Get all results at once
    facetFilters,
    attributesToRetrieve: ['id', 'title', 'category_id', 'subcategory_id'],
    facets: ['category_id', 'subcategory_id'],
    distinct: false
  }
  
  console.log("[Algolia Debug] Search parameters:", JSON.stringify(searchParams, null, 2))
  
  // Get all search results
  const searchResult = await index.search(
    searchQuery,
    searchParams
  )
  
  const { hits, nbHits } = searchResult
  
  // Convert hits to proper type and extract Medusa product IDs
  const validHits = (hits as AlgoliaHit[]).filter(hit => hit.id && typeof hit.id === 'string')

  console.log("[Algolia Debug] Total search results:", nbHits)
  console.log("[Algolia Debug] Valid hits:", validHits.length)

  return {
    hits: validHits,
    totalHits: nbHits
  }
}
