import PDFDocument from "pdfkit"

interface InvoiceGenerator {
  generateInvoice(doc: PDFDocument, order: any, fulfillment?: any): void
}

export default InvoiceGenerator