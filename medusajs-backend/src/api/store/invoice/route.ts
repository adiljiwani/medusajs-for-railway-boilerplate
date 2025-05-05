import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import InvoiceService from "../../../services/invoice"

type InvoiceRequestBody = {
  order_id: string
  fulfillment_id?: string
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { order_id, fulfillment_id } = req.query

  if (!order_id) {
    return res.status(400).json({ 
      message: "order_id is required" 
    })
  }

  const invoiceService: InvoiceService = req.scope.resolve("invoiceService")

  try {
    const invoice = await invoiceService.retrieveInvoice(
      order_id as string,
      fulfillment_id as string
    )
    
    if (!invoice) {
      return res.status(404).json({ 
        message: "Invoice not found" 
      })
    }
    
    return res.json(invoice)
  } catch (error) {
    console.error('[InvoiceRoute] Error retrieving invoice:', error)
    res.status(500).json({
      message: "Failed to retrieve invoice",
      error: error.message
    })
  }
}

export const POST = async (req: MedusaRequest<InvoiceRequestBody>, res: MedusaResponse) => {
  const { order_id, fulfillment_id } = req.body

  if (!order_id) {
    return res.status(400).json({ 
      message: "order_id is required" 
    })
  }

  const invoiceService: InvoiceService = req.scope.resolve("invoiceService")
  const orderService = req.scope.resolve("orderService")

  try {
    if (fulfillment_id) {
      // Verify the fulfillment belongs to the order
      const order = await orderService.retrieve(order_id, {
        relations: [
          "fulfillments",
          "items",
          "shipping_address",
          "customer",
          "region"
        ]
      })

      const fulfillment = order.fulfillments?.find(f => f.id === fulfillment_id)
      
      if (!fulfillment) {
        return res.status(404).json({ 
          message: `Fulfillment ${fulfillment_id} not found in order ${order_id}` 
        })
      }

      const invoiceUrl = await invoiceService.generateInvoice(
        order_id,
        fulfillment_id
      )
      
      // Get the updated invoice details
      const invoice = await invoiceService.retrieveInvoice(
        order_id,
        fulfillment_id
      )
      
      return res.json(invoice)
    } else {
      // Generate order invoice
      const invoiceUrl = await invoiceService.generateInvoice(order_id)
      
      // Get the updated invoice details
      const invoice = await invoiceService.retrieveInvoice(order_id)
      
      return res.json(invoice)
    }
  } catch (error) {
    console.error('[InvoiceRoute] Error generating invoice:', error)
    res.status(500).json({
      message: "Failed to generate invoice",
      error: error.message
    })
  }
} 