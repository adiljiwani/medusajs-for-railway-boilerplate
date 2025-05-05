import { formatAmount } from "../utils/format-amount"
import InvoiceGenerator from "../interfaces/invoice-generator"
import PDFDocument from "pdfkit"

class OrderInvoiceGenerator implements InvoiceGenerator {
  generateInvoice(doc: PDFDocument, order: any): void {
    // Header
    doc.fontSize(25).text('Order Invoice', { align: 'center' })
    doc.moveDown()

    // Company Information
    doc.font('Helvetica-Bold')
    doc.fontSize(12).text('Batteries-N-Things Inc', { align: 'left' })
    doc.font('Helvetica')
    doc.fontSize(10)
    doc.text('5-2800 John Street')
    doc.text('Markham ON L3R0E2')
    doc.text('(416)-368-0023')
    doc.text('info@bntbng.com')
    doc.text('GST Registration Number')
    doc.moveDown(2)
    
    // Order Details
    this.addOrderDetails(doc, order)
    
    // Table Headers
    this.addTableHeaders(doc)
    
    // Items
    this.addItems(doc, order)
    
    // Summary
    this.addSummary(doc, order)
  }

  private addOrderDetails(doc: PDFDocument, order: any): void {
    const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    
    doc.fontSize(12)
    
    // Left column - Order details
    doc.text(`Date: ${formattedDate}`, 50)
    doc.text(`Order ID: ${order.display_id}`, 50)
    doc.text(`Customer: ${order.email}`, 50)

    // Right column - Payment terms
    const rightColumnX = 300
    doc.font('Helvetica-Bold')
    doc.text(`Due Date: ${formattedDate}`, rightColumnX, doc.y - 36)
    doc.text('Terms: Due on receipt', rightColumnX)
    doc.font('Helvetica')
    
    // Add extra spacing (approximately 10 pixels)
    doc.moveDown(1.2)

    // Save current Y position to align all address sections
    const addressStartY = doc.y

    // Billing Address Section - Left side
    if (order.billing_address) {
      doc.font('Helvetica-Bold')
      doc.text('Bill To:', 50, addressStartY)
      doc.font('Helvetica')
      
      const billingAddress = order.billing_address
      let currentY = doc.y
      const lineHeight = 12 // Minimal line height for addresses
      
      if (billingAddress.first_name && billingAddress.last_name) {
        doc.text(`${billingAddress.first_name} ${billingAddress.last_name}`, 50, currentY)
        currentY += lineHeight
      }
      if (billingAddress.company) {
        doc.text(billingAddress.company, 50, currentY)
        currentY += lineHeight
      }
      if (billingAddress.address_1) {
        doc.text(billingAddress.address_1, 50, currentY)
        currentY += lineHeight
      }
      if (billingAddress.address_2) {
        doc.text(billingAddress.address_2, 50, currentY)
        currentY += lineHeight
      }
      doc.text([
        billingAddress.city,
        billingAddress.province,
        billingAddress.postal_code
      ].filter(Boolean).join(', '), 50, currentY)
      currentY += lineHeight
      
      if (billingAddress.country_code) {
        doc.text(billingAddress.country_code.toUpperCase(), 50, currentY)
      }
    }

    // Shipping Address Section - Middle column
    if (order.shipping_address) {
      doc.font('Helvetica-Bold')
      doc.text('Ship To:', 300, addressStartY)
      doc.font('Helvetica')
      
      const shippingAddress = order.shipping_address
      let currentY = doc.y
      const lineHeight = 12 // Minimal line height for addresses
      
      if (shippingAddress.first_name && shippingAddress.last_name) {
        doc.text(`${shippingAddress.first_name} ${shippingAddress.last_name}`, 300, currentY)
        currentY += lineHeight
      }
      if (shippingAddress.company) {
        doc.text(shippingAddress.company, 300, currentY)
        currentY += lineHeight
      }
      if (shippingAddress.address_1) {
        doc.text(shippingAddress.address_1, 300, currentY)
        currentY += lineHeight
      }
      if (shippingAddress.address_2) {
        doc.text(shippingAddress.address_2, 300, currentY)
        currentY += lineHeight
      }
      doc.text([
        shippingAddress.city,
        shippingAddress.province,
        shippingAddress.postal_code
      ].filter(Boolean).join(', '), 300, currentY)
      currentY += lineHeight
      
      if (shippingAddress.country_code) {
        doc.text(shippingAddress.country_code.toUpperCase(), 300, currentY)
      }
    }

    // Shipping Method Section - Right column
    if (order.shipping_methods?.[0]) {
      const shippingMethodX = 500
      doc.font('Helvetica-Bold')
      doc.text('Shipping Method:', shippingMethodX, addressStartY)
      doc.font('Helvetica')
      doc.text(order.shipping_methods[0].shipping_option?.name || 'Standard Shipping', shippingMethodX, doc.y)
    }

    // Move cursor to just below the addresses with minimal spacing
    doc.y = addressStartY + 85 // Approximate height for 6 lines of address at 12pt + labels
  }

  private addTableHeaders(doc: PDFDocument): void {
    const itemX = 50
    const quantityX = 250
    const priceX = 390
    const totalX = 460

    // Add a line above the table headers with minimal spacing
    doc.moveTo(50, doc.y).lineTo(540, doc.y).stroke()
    doc.moveDown(0.2)

    // Save the Y position for all headers
    const headerY = doc.y
    doc.font('Helvetica-Bold')
    doc.fontSize(10)
    doc.text('Item', itemX, headerY, { width: 190 })
    doc.text('Quantity', quantityX, headerY, { width: 80 })
    doc.text('Price', priceX, headerY, { width: 60, align: 'right' })
    doc.text('Total', totalX, headerY, { width: 80, align: 'right' })
    
    // Move cursor below all headers
    doc.y = headerY + doc.currentLineHeight()
    
    // Add a line below the table headers with minimal spacing
    doc.moveDown(0.2)
    doc.moveTo(50, doc.y).lineTo(540, doc.y).stroke()
    doc.moveDown(0.2)
    doc.font('Helvetica')
  }

  private addItems(doc: PDFDocument, order: any): void {
    const itemX = 50
    const quantityX = 250
    const priceX = 390
    const totalX = 460

    order.items.forEach(item => {
      const y = doc.y
      
      doc.text(item.title || 'Unnamed item', itemX, y, {
        width: 190,
        align: 'left'
      })
      
      const quantity = item.quantity
      const lineTotal = (item.unit_price || 0) * quantity
      
      doc.text(quantity.toString(), quantityX, y, { width: 80 })
      doc.text(formatAmount((item.unit_price || 0), order.region), priceX, y, { width: 60, align: 'right' })
      doc.text(formatAmount(lineTotal, order.region), totalX, y, { width: 80, align: 'right' })
      
      // Add 0.5 spacing between rows
      doc.moveDown(2.0)
    })
  }

  private addSummary(doc: PDFDocument, order: any): void {
    const summaryX = 350
    const totalX = 460
    
    doc.moveDown()
    doc.font('Helvetica-Bold')
    
    const subtotal = order.subtotal ?? 0
    const taxTotal = order.tax_total ?? 0
    const total = order.total ?? (subtotal + taxTotal)

    // Save starting Y position for each row
    let currentY = doc.y

    // First row - Subtotal
    doc.text('Subtotal:', summaryX, currentY)
    doc.text(formatAmount(subtotal, order.region), totalX, currentY, { align: 'right', width: 80 })
    doc.moveDown(0.5)
    currentY = doc.y

    // Second row - Tax
    doc.text('Tax:', summaryX, currentY)
    doc.text(formatAmount(taxTotal, order.region), totalX, currentY, { align: 'right', width: 80 })
    doc.moveDown(0.5)
    currentY = doc.y

    // Third row - Total
    doc.text('Total:', summaryX, currentY)
    doc.text(formatAmount(total, order.region), totalX, currentY, { align: 'right', width: 80 })
    
    // Add extra space before notes
    doc.moveDown(2)
    
    // Add notes below the totals
    doc.font('Helvetica')
    doc.text('Thank you for your business.', 50)
    doc.text('All sales are final.', 50)
    doc.text("Manufacturer's warranty.", 50)
    doc.text('Any discrepancy is to be notified no later than', 50)
    doc.text('48 hours after receipt of the invoice.', 50)
  }
}

export default OrderInvoiceGenerator