import { OrderService, Address, Payment } from "@medusajs/medusa"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"

type OrderPlacedEvent = {
  id: string
  no_notification: boolean
}

// No need for ExtendedOrder interface since we're using the base Order type
// which already includes payments: Payment[]

// Utility function to safely get the SKU
function getItemSKU(item: any): string {
  return item.variant?.sku || 'N/A'
}

// Utility function to safely get payment method ID from payment data
function getSelectedPaymentMethodId(payment: Payment): number | undefined {
  console.log("[getSelectedPaymentMethodId] Payment data:", payment.data)
  if (!payment.data || typeof payment.data !== 'object') {
    console.log("[getSelectedPaymentMethodId] No data or data is not an object")
    return undefined
  }
  const data = payment.data as Record<string, unknown>
  console.log("[getSelectedPaymentMethodId] Payment data as record:", data)
  const methodId = data.selected_payment_method_id
  console.log("[getSelectedPaymentMethodId] Selected method ID:", methodId)
  return typeof methodId === 'number' ? methodId : undefined
}

export default async function orderPlacedHandler({
  data,
  container,
}: SubscriberArgs<OrderPlacedEvent>) {
  console.log("========== ORDER PLACED SUBSCRIBER START ==========")
  console.log("[OrderPlaced] Subscriber triggered with order ID:", data.id)
  
  const orderService: OrderService = container.resolve("orderService")
  const invoiceService = container.resolve("invoiceService")
  const sendgridService = container.resolve("sendgridService")

  console.log("[OrderPlaced] Services resolved:", {
    orderService: !!orderService,
    invoiceService: !!invoiceService,
    sendgridService: !!sendgridService
  })

  try {
    console.log("[OrderPlaced] Retrieving order details...")
    const order = await orderService.retrieveWithTotals(data.id, {
      relations: [
        "customer",
        "items",
        "items.variant",
        "items.variant.product",
        "shipping_methods",
        "shipping_address",
        "billing_address",
        "payments"
      ],
    })

    // Get the selected payment method ID from the order's payment data
    const manualPayment = order.payments.find(
      payment => payment.provider_id === "manual"
    )

    if (!manualPayment) {
      console.log("[OrderPlaced] No manual payment found", {
        payments: order.payments.map(p => ({ 
          id: p.id, 
          provider: p.provider_id,
          data: p.data 
        }))
      })
      return
    }

    console.log("[OrderPlaced] Found manual payment:", {
      id: manualPayment.id,
      provider: manualPayment.provider_id,
      data: manualPayment.data,
      raw_data: JSON.stringify(manualPayment.data)
    })

    const selectedPaymentMethodId = getSelectedPaymentMethodId(manualPayment)

    if (selectedPaymentMethodId) {
      try {
        console.log("[OrderPlaced] Saving payment method...", {
          orderId: order.id,
          methodId: selectedPaymentMethodId,
          paymentData: manualPayment.data
        })

        const result = await dataSource.query(
          `INSERT INTO order_payment_method 
            (id, order_id, payment_method_id, created_at, updated_at)
           VALUES 
            ('opm_' || substr(md5(random()::text), 0, 27), $1, $2, NOW(), NOW())
           RETURNING *`,
          [order.id, selectedPaymentMethodId]
        )

        console.log("[OrderPlaced] Payment method saved successfully:", result)
      } catch (error) {
        console.error("[OrderPlaced] Failed to save payment method:", error)
      }
    } else {
      console.log("[OrderPlaced] No payment method ID found in payment data", {
        paymentId: manualPayment.id,
        paymentData: manualPayment.data
      })
    }

    console.log("[OrderPlaced] Order details:", {
      id: order.id,
      display_id: order.display_id,
      customer_email: order.customer?.email || 'No email found',
      customer_name: order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'No customer name',
      items_count: order.items?.length || 0,
    })

    // Generate invoice
    try {
      console.log(`[OrderPlaced] Generating invoice for order ${data.id}`)
      const invoicePath = await invoiceService.generateInvoice(order.id)
      
      console.log(`[OrderPlaced] Updating order metadata with invoice path`)
      await orderService.update(order.id, {
        metadata: {
          invoice_path: invoicePath
        }
      })
      console.log(`[OrderPlaced] Successfully processed invoice for order ${data.id}`)
    } catch (error) {
      console.error(`[OrderPlaced] Failed to generate invoice:`, error)
      // Continue with email even if invoice fails
    }

    // Send confirmation email
    if (!data.no_notification && order.customer?.email) {
      const line_items = order.items.map((item) => ({
        name: item.title,
        sku: getItemSKU(item),
        quantity: item.quantity,
        price: (item.unit_price / 100).toFixed(2),
        total: ((item.unit_price * item.quantity) / 100).toFixed(2),
      }))

      console.log("[OrderPlaced] Line Items:", JSON.stringify(line_items, null, 2))

      const shippingAddress = (order.shipping_address || {}) as Address

      console.log("[OrderPlaced] Preparing email data...")
      console.log("[OrderPlaced] Using template ID:", process.env.SENDGRID_ORDER_PLACED_TEMPLATE)
      
      const emailData = {
        to: order.customer.email,
        from: process.env.SENDGRID_FROM,
        template_id: process.env.SENDGRID_ORDER_PLACED_TEMPLATE,
        dynamic_template_data: {
          first_name: order.customer.first_name,
          order_number: order.display_id,
          order_date: new Date(order.created_at).toLocaleDateString(),
          line_items,
          order_summary: {
            subtotal: (order.subtotal / 100).toFixed(2),
            shipping: (order.shipping_total / 100).toFixed(2),
            tax: (order.tax_total / 100).toFixed(2),
            total: (order.total / 100).toFixed(2),
          },
          shipping_address: {
            first_name: shippingAddress.first_name || '',
            last_name: shippingAddress.last_name || '',
            address_1: shippingAddress.address_1 || '',
            address_2: shippingAddress.address_2 || '',
            city: shippingAddress.city || '',
            province: shippingAddress.province || '',
            postal_code: shippingAddress.postal_code || '',
            country: shippingAddress.country_code?.toUpperCase() || '',
          },
        },
      }
      console.log("[OrderPlaced] Email data prepared:", JSON.stringify(emailData, null, 2))

      console.log("[OrderPlaced] Sending email via SendGrid...")
      await sendgridService.sendEmail(emailData)
      console.log("[OrderPlaced] Order confirmation email sent successfully!")
    } else {
      console.log("[OrderPlaced] Skipping email notification:", {
        no_notification: data.no_notification,
        has_email: !!order.customer?.email
      })
    }
  } catch (error) {
    console.error("[OrderPlaced] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    console.error("[OrderPlaced] Full error object:", error)
    throw error
  } finally {
    console.log("========== ORDER PLACED SUBSCRIBER END ==========")
  }
}

export const config: SubscriberConfig = {
  event: OrderService.Events.PLACED,
  context: {
    subscriberId: "order-placed-handler",
  },
} 