import { ProductVariant } from "@medusajs/medusa"
import { Container, Text, clx } from "@medusajs/ui"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type ProductHit = {
  id: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  variants: ProductVariant[]
  collection_handle: string | null
  collection_id: string | null
}

type HitProps = {
  hit: ProductHit
}

const Hit = ({ hit }: HitProps) => {
  return (
    <LocalizedClientLink
      href={`/products/${hit.handle}`}
      data-testid="search-result"
    >
      <Container
        key={hit.id}
        className="flex sm:flex-col gap-2 w-full p-4 shadow-elevation-card-rest hover:shadow-elevation-card-hover items-center sm:justify-center"
      >
        <Thumbnail
          thumbnail={hit.thumbnail}
          size="square"
          className="group h-12 w-12 sm:h-full sm:w-full"
        />
        <div className="flex flex-col justify-between group">
          <div className="flex flex-col">
            <Text
              className="text-ui-fg-subtle text-sm line-clamp-2"
              data-testid="product-title"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minHeight: "3.0em",
                lineHeight: "1.5em",
              }}
            >
              {hit.title}
            </Text>
            <Text
              className={clx("text-ui-fg-muted")}
              data-testid="quantity"
            >
              {"SKU: "+ hit.handle}
            </Text>
          </div>
        </div>
      </Container>
    </LocalizedClientLink>
  )
}

export default Hit
