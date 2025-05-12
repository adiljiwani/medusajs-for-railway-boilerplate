import { Heading, Text } from "@medusajs/ui"
import Link from "next/link"

import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import InteractiveLink from "@modules/common/components/interactive-link"
import { Customer } from "@medusajs/medusa"

type SearchResultsTemplateProps = {
  query: string
  ids: string[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
  customer: Omit<Customer, "password_hash"> | null
  totalHits: number
  totalPages: number
  category_id?: string
  subcategory_id?: string
}

const SearchResultsTemplate = ({
  query,
  ids,
  sortBy,
  page,
  countryCode,
  customer,
  totalHits,
  totalPages,
  category_id,
  subcategory_id,
}: SearchResultsTemplateProps) => {
  const pageNumber = page ? parseInt(page) : 1

  return (
    <>
      <div className="flex justify-between border-b w-full py-6 px-8 small:px-14 items-center">
        <div className="flex flex-col items-start">
          <Text className="text-ui-fg-muted">Search Results for:</Text>
          <Heading>
            {decodeURI(query)} ({totalHits})
          </Heading>
          {(category_id || subcategory_id) && (
            <Text className="text-ui-fg-muted text-sm">
              Filtered by: {category_id && "Category"} {category_id && subcategory_id && "and"} {subcategory_id && "Subcategory"}
            </Text>
          )}
        </div>
        <div className="flex items-center gap-x-4">
          <InteractiveLink clear={true} href="/store">
            Clear Search
          </InteractiveLink>
          <InteractiveLink href="/">Home</InteractiveLink>
        </div>
      </div>

      <div className="flex flex-col small:flex-row small:items-start p-6">
        {ids.length > 0 ? (
          <>
            <RefinementList sortBy={sortBy || "created_at"} search />
            <div className="content-container">
              <PaginatedProducts
                productsIds={ids}
                sortBy={sortBy}
                page={pageNumber}
                countryCode={countryCode}
                customer={customer}
                totalPages={totalPages}
              />
            </div>
          </>
        ) : (
          <Text className="ml-8 small:ml-14 mt-3">No results.</Text>
        )}
      </div>
    </>
  )
}

export default SearchResultsTemplate
