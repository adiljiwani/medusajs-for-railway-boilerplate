import { Order, Region, LineItem } from "@medusajs/medusa"
import { Table, Text, Button } from "@medusajs/ui"
import { ShoppingCartIcon } from "@heroicons/react/24/outline"

import { handleAddToCart } from "@modules/cart/utils"
import LineItemOptions from "@modules/common/components/line-item-options"
import Thumbnail from "@modules/products/components/thumbnail"
import LineItemPriceNoTax from "@modules/order/components/line-item-price-no-tax"
import LineItemUnitPriceNoTax from "@modules/order/components/line-item-unit-price-no-tax"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import { useState } from "react"
import { useParams } from "next/navigation"

type ItemsProps = {
  order: Order
  region: Region
}

type ItemProps = {
  item: Omit<LineItem, "beforeInsert">
  region: Region
}

const Item = ({ item, region }: ItemProps) => {
  return (
    <>
      {/* Thumbnail */}
      <Table.Cell className="!pl-0 p-4 w-24">
        <div className="flex w-16">
          <Thumbnail thumbnail={item.thumbnail} size="square" />
        </div>
      </Table.Cell>

      {/* Title and Options */}
      <Table.Cell className="text-left">
        <Text className="txt-medium-plus text-ui-fg-base" data-testid="product-name">
          {item.title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
        <div className="flex gap-x-1 mt-1">
          <Text className="text-ui-fg-muted">
            <span data-testid="product-quantity">{item.quantity}</span>x
          </Text>
          <LineItemUnitPriceNoTax item={item} region={region} style="tight" />
        </div>
      </Table.Cell>
    </>
  )
}

const FulfillmentItemsTable = ({ order, region }: ItemsProps) => {
  const { items, fulfillments } = order
  const [addingItemId, setAddingItemId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const countryCode = useParams().countryCode as string

  // Helper function to calculate shipped and backorder quantities
  const getFulfillmentQuantities = (itemId: string) => {
    let shippedQuantity = 0

    // Only count quantities from fulfillments that are marked as shipped
    fulfillments.forEach((fulfillment) => {
      if (fulfillment.shipped_at) { // Only count if the fulfillment has been shipped
        fulfillment.items.forEach((fulfilledItem) => {
          if (fulfilledItem.item_id === itemId) {
            shippedQuantity += fulfilledItem.quantity
          }
        })
      }
    })

    // Calculate backorder quantity
    const item = items.find((item) => item.id === itemId)
    const backorderQuantity = item ? item.quantity - shippedQuantity : 0

    return { shippedQuantity, backorderQuantity }
  }

  const handleReorder = async () => {
    setIsReordering(true)
    try {
      // Add each item to cart sequentially
      for (const item of items) {
        if (item.variant_id) {
          await handleAddToCart({
            variantId: item.variant_id,
            quantity: item.quantity,
            countryCode: countryCode,
            setIsAdding: (isAdding: boolean) => {
              setIsReordering(isAdding)
            },
          })
        }
      }
    } catch (error) {
      console.error("Error reordering items:", error)
      setIsReordering(false)
    }
  }

  const shouldShowFulfillmentDetails =
    order.fulfillment_status === "partially_shipped" ||
    order.fulfillment_status === "shipped"

  return (
    <div className="flex flex-col p-0 m-0">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan={2} className="text-left">
              Item
            </Table.HeaderCell>
            <Table.HeaderCell className="text-center">Shipped</Table.HeaderCell>
            <Table.HeaderCell className="text-center">Backorder</Table.HeaderCell>
            <Table.HeaderCell className="text-center">Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body data-testid="products-table">
          {items?.length && region
            ? items
                .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
                .map((item) => {
                  const { shippedQuantity, backorderQuantity } =
                    getFulfillmentQuantities(item.id)

                  return (
                    <Table.Row key={item.id}>
                      {/* Item spans multiple cells */}
                      <Item item={item} region={region} />
                      {/* Shipped Quantity */}
                      <Table.Cell className="text-center">
                        {shouldShowFulfillmentDetails ? shippedQuantity : "N/A"}
                      </Table.Cell>
                      {/* Backorder Quantity */}
                      <Table.Cell className="text-center">
                        {shouldShowFulfillmentDetails ? backorderQuantity : "N/A"}
                      </Table.Cell>
                      {/* Actions */}
                      <Table.Cell className="text-center">
                        <Button
                          variant="primary"
                          size="base"
                          className="flex items-center justify-center p-2"
                          onClick={async () => {
                            setAddingItemId(item.variant_id!)
                            await handleAddToCart({
                              variantId: item.variant_id!,
                              quantity: item.quantity,
                              countryCode: countryCode,
                              setIsAdding: (isAdding: boolean) => {
                                if (isAdding) {
                                  setAddingItemId(item.variant_id!)
                                } else {
                                  setAddingItemId(null)
                                }
                              },
                            })
                          }}
                          disabled={addingItemId === item.variant_id}
                          isLoading={addingItemId === item.variant_id}
                        >
                          <ShoppingCartIcon className="h-4 w-4 text-white" />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  )
                })
            : Array.from(Array(5).keys()).map((i) => (
                <Table.Row key={i}>
                  <Table.Cell className="text-left">
                    <SkeletonLineItem />
                  </Table.Cell>
                </Table.Row>
              ))}
        </Table.Body>
      </Table>
      <div className="w-full mt-4">
        <Button
          variant="primary"
          size="large"
          onClick={handleReorder}
          disabled={isReordering}
          isLoading={isReordering}
          className="w-full"
        >
          <ShoppingCartIcon className="h-5 w-5 mr-2" />
          Reorder
        </Button>
      </div>
    </div>
  )
}

export default FulfillmentItemsTable