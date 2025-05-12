import { LineItem, Region } from "@medusajs/medusa"
import { Text } from "@medusajs/ui"
import { formatAmount } from "@lib/util/prices"

type LineItemUnitPriceProps = {
  item: Omit<LineItem, "beforeInsert">
  region: Region
  style?: "default" | "tight"
}

const LineItemUnitPriceNoTax = ({
  item,
  region,
  style = "default",
}: LineItemUnitPriceProps) => {
  const className = style === "tight" ? "text-ui-fg-muted" : ""

  return (
    <Text className={className} data-testid="line-item-unit-price">
      {formatAmount({
        amount: item.unit_price,
        region: region,
        includeTaxes: false,
      })}
    </Text>
  )
}

export default LineItemUnitPriceNoTax 