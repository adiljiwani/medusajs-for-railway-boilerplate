import algoliasearch from "algoliasearch/lite"

const appId = process.env.NEXT_PUBLIC_SEARCH_APP_ID || "NDUCF0M8CC"

const apiKey = process.env.NEXT_PUBLIC_SEARCH_API_KEY || "c0a3689bf0bda7fe8e96aeadd6830062"

export const searchClient = algoliasearch(appId, apiKey)

export const SEARCH_INDEX_NAME = process.env.NEXT_PUBLIC_INDEX_NAME || "products_v2"

// Configure different search parameters for preview and full search
export const SEARCH_PARAMS = {
  PREVIEW: {
    hitsPerPage: 25,
  },
  FULL: {
    hitsPerPage: 1000,
  },
}