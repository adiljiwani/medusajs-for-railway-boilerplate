import PDFDocument from "pdfkit"

interface PackingSlipGenerator {
  generatePackingSlip(doc: PDFDocument, order: any, fulfillment?: any, items?: any): void
}

export default PackingSlipGenerator