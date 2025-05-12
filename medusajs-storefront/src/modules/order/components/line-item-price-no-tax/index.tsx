import { LineItem, Region } from "@medusajs/medusa"
import { Text } from "@medusajs/ui"
import { formatAmount } from "@lib/util/prices"

type LineItemPriceProps = {
  item: Omit<LineItem, "beforeInsert">
  region: Region
  style?: "default" | "tight"
}

const LineItemPriceNoTax = ({
  item,
  region,
  style = "default",
}: LineItemPriceProps) => {
  const total = item.unit_price * item.quantity

  const className = style === "tight" ? "text-ui-fg-base" : ""

  return (
    <Text className={className} data-testid="line-item-price">
      {formatAmount({
        amount: total,
        region: region,
        includeTaxes: false,
      })}
    </Text>
  )
}

export default LineItemPriceNoTax 