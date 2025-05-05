import PackingSlipGenerator from "src/interfaces/packing-slip-generator"
import PDFDocument from "pdfkit"
import { formatAmount } from "../utils/format-amount"

// TODO: Implement packing slip generator

class PackingSlip implements PackingSlipGenerator {
  generatePackingSlip(doc: PDFDocument, order: any, fulfillment: any, items: any[]): void {
    doc.font('Helvetica-Bold')
    doc.fontSize(25).text("Batteries 'N Things", { align: 'center' })
    doc.font('Helvetica')

    doc.font('Helvetica-Bold')
    doc.fontSize(18).text('Packing Slip', { align: 'center' })
    doc.font('Helvetica')
    doc.moveDown()

    // Order Details
    this.addOrderDetails(doc, order, fulfillment)
    
    // Current Fulfillment Items Table
    this.addShipmentItemsTable(doc, order, fulfillment, items)
  }

  private addOrderDetails(doc: PDFDocument, order: any, fulfillment: any): void {
    const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    
    doc.fontSize(12)

    // Find fulfillment number by getting its index in the order's fulfillments array
    const fulfillmentIndex = order.fulfillments.findIndex(f => f.id === fulfillment.id)
    doc.font('Helvetica-Bold')
    doc.text(`Fulfillment #${fulfillmentIndex + 1}`)
    doc.font('Helvetica')
    
    // Order and Fulfillment Details
    doc.text(`Date: ${formattedDate}`)
    doc.text(`Order #: ${order.display_id}`)
    doc.text(`Customer: ${order.customer.first_name} ${order.customer.last_name}`)
    
    doc.moveDown()

    // Shipping Address
    if (order.shipping_address) {
      doc.font('Helvetica-Bold')
      doc.text('Ship To:')
      doc.font('Helvetica')
      
      const address = order.shipping_address
      const addressLines = [
        address.first_name && address.last_name ? 
          `${address.first_name} ${address.last_name}` : undefined,
        address.company,
        address.address_1,
        address.address_2,
        [
          address.city,
          address.province,
          address.postal_code
        ].filter(Boolean).join(', '),
        address.country_code?.toUpperCase()
      ].filter(Boolean)

      addressLines.forEach(line => doc.text(line))
    }

    // Shipping Method
    if (fulfillment.shipping_details) {
      doc.moveDown()
      doc.font('Helvetica-Bold')
      doc.text('Shipping Method:')
      doc.font('Helvetica')
      doc.text(fulfillment.shipping_details.option_name || 'Standard Shipping')
      
      if (fulfillment.tracking_numbers?.length) {
        doc.text(`Tracking Number: ${fulfillment.tracking_numbers.join(', ')}`)
      }
    }

    doc.moveDown(2)
  }

  private addShipmentItemsTable(doc: PDFDocument, order: any, fulfillment: any, items: any[]): void {
    const itemX = 50
    const skuX = 200
    const quantityX = 350

    // Headers
    doc.font('Helvetica-Bold')
    const headerY = doc.y
    doc.text('Item', itemX, headerY)
    doc.text('SKU', skuX, headerY)
    doc.text('Quantity', quantityX, headerY)
    doc.moveDown()
    doc.font('Helvetica')

    // Use the selected items array instead of fulfillment items
    items.forEach(selectedItem => {
      const orderItem = order.items.find(item => item.id === selectedItem.id)
      if (!orderItem) return

      const y = doc.y
      
      // Item name
      doc.text(orderItem.title || 'Unnamed item', itemX, y, {
        width: 140,
        align: 'left'
      })

      // SKU
      const sku = orderItem.variant?.sku || 'N/A'
      doc.text(sku, skuX, y)

      // Quantity from selected items
      doc.text(selectedItem.quantity.toString(), quantityX, y)

      const textHeight = Math.max(
        doc.heightOfString(orderItem.title || 'Unnamed item', { width: 140 }),
        doc.heightOfString(sku),
        doc.heightOfString(selectedItem.quantity.toString()),
      )

      doc.moveDown(textHeight / 12 + 0.5)
    })

    doc.moveDown(2)
  }
}

export default PackingSlip
