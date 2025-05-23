import { LineItem, Region } from "@medusajs/medusa"
import { Table } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import ItemNoTax from "@modules/order/components/item-no-tax"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsProps = {
  items: LineItem[]
  region: Region
}

const ItemsNoTax = ({ items, region }: ItemsProps) => {
  return (
    <div className="flex flex-col">
      <Divider className="!mb-0" />
      <Table>
        <Table.Body data-testid="products-table">
          {items?.length && region
            ? items
                .sort((a, b) => {
                  return a.created_at > b.created_at ? -1 : 1
                })
                .map((item) => {
                  return <ItemNoTax key={item.id} item={item} region={region} />
                })
            : Array.from(Array(5).keys()).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsNoTax 