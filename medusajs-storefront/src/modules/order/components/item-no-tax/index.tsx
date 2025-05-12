import { LineItem, Region } from "@medusajs/medusa"
import { Table, Text } from "@medusajs/ui"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPriceNoTax from "@modules/order/components/line-item-price-no-tax"
import LineItemUnitPriceNoTax from "@modules/order/components/line-item-unit-price-no-tax"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: Omit<LineItem, "beforeInsert">
  region: Region
}

const ItemNoTax = ({ item, region }: ItemProps) => {
  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <div className="flex w-16">
          <Thumbnail thumbnail={item.thumbnail} size="square" />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text className="txt-medium-plus text-ui-fg-base" data-testid="product-name">{item.title}</Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      <Table.Cell className="!pr-0">
        <span className="!pr-0 flex flex-col items-end h-full justify-center">
          <span className="flex gap-x-1 ">
            <Text className="text-ui-fg-muted"><span data-testid="product-quantity">{item.quantity}</span>x </Text>
            <LineItemUnitPriceNoTax item={item} region={region} style="tight" />
          </span>

          <LineItemPriceNoTax item={item} region={region} style="tight" />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default ItemNoTax 