import { Order } from "@medusajs/medusa"
import { Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: Order
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  const getDisplayStatus = () => {
    if (order.status === "canceled") {
      return "canceled"
    }
    
    if (order.fulfillment_status === "canceled") {
      return "not_fulfilled"
    }

    return order.fulfillment_status
  }

  // Helper function to filter fulfillments with tracking links
  const getFulfillmentsWithTracking = () => {
    return order.fulfillments.filter(
      (fulfillment) =>
        fulfillment.tracking_links?.length > 0 &&
        (order.fulfillment_status === "partially_shipped" ||
          order.fulfillment_status === "shipped")
    )
  }

  return (
    <div>
      <Text>
        We have sent the order confirmation details to{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2">
        Order date:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        Order number:{" "}
        <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text className="font-semibold">
              Payment status:{" "}
              <span
                className="text-ui-fg-subtle"
                data-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
            <Text className="font-semibold">
              Order status:{" "}
              <span
                className="text-ui-fg-subtle"
                data-testid="order-status"
              >
                {formatStatus(getDisplayStatus())}
              </span>
            </Text>
          </>
        )}
      </div>

      {/* Tracking Numbers section */}
      {(order.fulfillment_status === "partially_shipped" ||
        order.fulfillment_status === "shipped") && (
        <div className="mt-4">
          <Text className="font-semibold">Tracking Numbers:</Text>
          {getFulfillmentsWithTracking().map((fulfillment, index) => (
            <div key={index} className="mt-2">
              {fulfillment.tracking_links.length > 0 && (
                <Text>
                  <span className="text-ui-fg-base">- Fulfillment #{index + 1}:</span>{" "}
                  <span className="text-ui-fg-muted">
                    {fulfillment.tracking_links.map((link, i) => (
                      <span key={i}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ui-fg-interactive"
                        >
                          {link.tracking_number}
                        </a>
                        {i < fulfillment.tracking_links.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </span>
                </Text>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderDetails