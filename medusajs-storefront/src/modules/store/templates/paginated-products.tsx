import { getProductsListWithSort, getRegion } from "@lib/data"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Customer } from "@medusajs/medusa"

const PRODUCT_LIMIT = 50

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  customer,
  totalPages: providedTotalPages,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  customer: Omit<Customer, "password_hash"> | null
  totalPages?: number
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  const {
    response: { products, count },
  } = await getProductsListWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const finalTotalPages = providedTotalPages || Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid w-full grid-cols-2 gap-4 small:grid-cols-3 medium:grid-cols-5"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id} className="flex flex-col">
              <ProductPreview
                productPreview={p}
                region={region}
                customer={customer}
              />
            </li>
          )
        })}
      </ul>
      {finalTotalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={finalTotalPages}
        />
      )}
    </>
  )
}
