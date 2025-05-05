import { OrderService } from "@medusajs/medusa"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Order, Fulfillment } from "@medusajs/medusa"

// The event data will contain the order and the fulfillment
type FulfillmentCreatedEvent = {
  id: string // order id
  fulfillment_id: string
  no_notification: boolean
}

export default async function fulfillmentCreatedHandler({
  data,
  container,
}: SubscriberArgs<FulfillmentCreatedEvent>) {
  console.log(`[FulfillmentSubscriber] Fulfillment created event received for order ${data.id}`)
  console.log(`[FulfillmentSubscriber] Fulfillment ID:`, data.fulfillment_id)
  
  const orderService: OrderService = container.resolve("orderService")
  const invoiceService = container.resolve("invoiceService")

  try {
    // Get the order with all necessary relations
    const order = await orderService.retrieve(data.id, {
      relations: ["items", "shipping_address", "customer", "region", "fulfillments"]
    })

    const fulfillment = order.fulfillments.find(f => f.id === data.fulfillment_id)

    // Create a modified order object with only fulfilled items
    const fulfilledOrder = {
      ...order,
      original_items: order.items,
      items: order.items.filter(item => 
        fulfillment.items.some(fulfillmentItem => 
          fulfillmentItem.item_id === item.id
        )
      ).map(item => {
        const fulfillmentItem = fulfillment.items.find(fi => fi.item_id === item.id)
        return {
          ...item,
          quantity: fulfillmentItem.quantity
        }
      }),
      // Recalculate totals based on fulfilled items only
      subtotal: fulfillment.items.reduce((sum, fulfillmentItem) => {
        const orderItem = order.items.find(item => item.id === fulfillmentItem.item_id)
        return sum + (orderItem?.unit_price || 0) * fulfillmentItem.quantity
      }, 0),
      // Add fulfillment ID to filename to distinguish from main invoice
      display_id: `${order.display_id}-fulfillment-${fulfillment.id}`
    }

    // Generate invoice for fulfilled items
    const invoicePath = await invoiceService.generateInvoice(order.id, fulfilledOrder)
    
    // Store the invoice path in order metadata
    await orderService.update(order.id, {
      metadata: {
        ...order.metadata,
        [`fulfillment_${fulfillment.id}_invoice_path`]: invoicePath
      }
    })

    console.log(`[FulfillmentSubscriber] Successfully generated fulfillment invoice: ${invoicePath}`)
  } catch (error) {
    console.error("Failed to generate fulfillment invoice:", error)
    console.error("Error details:", error.stack)
  }
}

export const config: SubscriberConfig = {
  event: OrderService.Events.FULFILLMENT_CREATED
} 