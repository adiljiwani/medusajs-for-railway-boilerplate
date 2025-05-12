import { formatAmount } from "@lib/util/prices"
import { InformationCircleSolid } from "@medusajs/icons"
import { Order } from "@medusajs/medusa"
import { Tooltip } from "@medusajs/ui"
import React from "react"

type OrderTotalsProps = {
  order: Order
}

const OrderTotals: React.FC<OrderTotalsProps> = ({ order }) => {
  const {
    subtotal,
    discount_total,
    gift_card_total,
    shipping_total,
    tax_total
  } = order

  const getAmount = (amount: number | null | undefined) => {
    return formatAmount({
      amount: amount || 0,
      region: order.region,
      includeTaxes: false,
    })
  }

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span className="flex gap-x-1 items-center">
            Subtotal
            <Tooltip content="Order total excluding shipping and taxes.">
              <InformationCircleSolid color="var(--fg-muted)" />
            </Tooltip>
          </span>
          <span data-testid="order-subtotal" data-value={subtotal || 0}>
            {getAmount(subtotal)}
          </span>
        </div>
        {!!discount_total && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="order-discount"
              data-value={discount_total || 0}
            >
              - {getAmount(discount_total)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="order-shipping" data-value={shipping_total || 0}>
            {getAmount(shipping_total)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Taxes</span>
          <span data-testid="order-tax" data-value={tax_total || 0}>
            {getAmount(tax_total)}
          </span>
        </div>
        {!!gift_card_total && (
          <div className="flex items-center justify-between">
            <span>Gift card</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="order-gift-card-amount"
              data-value={gift_card_total || 0}
            >
              - {getAmount(gift_card_total)}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="order-total"
          data-value={subtotal - (discount_total || 0) + (shipping_total || 0) - (gift_card_total || 0) + (tax_total || 0)}
        >
          {getAmount(subtotal - (discount_total || 0) + (shipping_total || 0) - (gift_card_total || 0) + (tax_total || 0))}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default OrderTotals 