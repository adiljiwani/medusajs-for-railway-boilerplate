import { Lifetime } from "awilix"
import { TransactionBaseService } from "@medusajs/medusa"
import { IEventBusService } from "@medusajs/types"
import { OrderService } from "@medusajs/medusa"
import PDFDocument from "pdfkit"
import AWS from "aws-sdk"
import fs from "fs"
import path from "path"
import OrderInvoiceGenerator from "./order-invoice"
import FulfillmentInvoiceGenerator from "./fulfillment-invoice"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"

class InvoiceService extends TransactionBaseService {
  static LIFE_TIME = Lifetime.SCOPED
  protected readonly eventBusService_: IEventBusService
  protected readonly orderService_: OrderService
  private orderInvoiceGenerator: OrderInvoiceGenerator
  private fulfillmentInvoiceGenerator: FulfillmentInvoiceGenerator
  private s3: AWS.S3

  constructor(
    { 
      eventBusService,
      orderService,
    }: { 
      eventBusService: IEventBusService
      orderService: OrderService 
    },
    options: Record<string, unknown>
  ) {
    // @ts-ignore
    super(...arguments)

    this.eventBusService_ = eventBusService
    this.orderService_ = orderService
    this.orderInvoiceGenerator = new OrderInvoiceGenerator()
    this.fulfillmentInvoiceGenerator = new FulfillmentInvoiceGenerator()

    // Initialize S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION
    })
  }

  private async saveInvoice(pdfBuffer: Buffer, folder: string, fileName: string): Promise<{ localPath: string, s3Url: string }> {
    // Save locally
    const localFolder = path.join(__dirname, `../../../uploads/invoices/${folder}`)
    const localPath = path.join(localFolder, fileName)
    
    await fs.promises.mkdir(localFolder, { recursive: true })
    await fs.promises.writeFile(localPath, pdfBuffer)
    
    console.log(`[InvoiceService] Successfully saved invoice locally: ${localPath}`)

    // Save to S3
    const s3Key = `${folder}/${fileName}`
    const uploadResult = await this.s3.upload({
      Bucket: process.env.S3_INVOICES_BUCKET!,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    }).promise()

    console.log(`[InvoiceService] Successfully uploaded invoice to S3: ${uploadResult.Location}`)

    return {
      localPath,
      s3Url: uploadResult.Location
    }
  }

  async generateInvoice(orderId: string, fulfillmentId?: string, orderOverride?: any): Promise<string> {
    console.log(`[InvoiceService] Starting invoice generation for order ${orderId}${fulfillmentId ? `, fulfillment ${fulfillmentId}` : ''}`)

    let order
    let fulfillment
    if (orderOverride) {
      order = orderOverride
    } else {
      const orders = await this.orderService_.list(
        { id: orderId },
        { 
          relations: [
            "items", 
            "shipping_address",
            "billing_address",
            "customer", 
            "region",
            "fulfillments",
            "fulfillments.items"
          ] 
        }
      )

      if (!orders.length) {
        throw new Error(`No order found with id ${orderId}`)
      }
      
      order = orders[0]

      if (fulfillmentId) {
        fulfillment = order.fulfillments?.find(f => f.id === fulfillmentId)
        
        if (fulfillment) {
          // Get the fulfillment shipping price from fulfillment_shipping_price table
          const [fulfillmentShippingPrice] = await dataSource.query(`
            SELECT price
            FROM fulfillment_shipping_price
            WHERE fulfillment_id = $1
          `, [fulfillmentId])

          if (fulfillmentShippingPrice) {
            fulfillment.shipping_details = {
              price: fulfillmentShippingPrice.price
            }
          }
        }
      }
    }

    const doc = new PDFDocument({ margin: 50 })
    const isFulfillment = fulfillmentId ? true : false
    
    // Determine the folder and filename
    const folder = isFulfillment ? 'fulfillments' : 'orders'
    const fileName = `invoice-${order.display_id}${isFulfillment ? `-fulfillment-${fulfillmentId}` : ''}.pdf`

    // Create a buffer to store the PDF
    const chunks: Buffer[] = []
    doc.on('data', chunks.push.bind(chunks))

    // Choose the appropriate generator
    const generator = isFulfillment
      ? this.fulfillmentInvoiceGenerator 
      : this.orderInvoiceGenerator

    // Generate the invoice
    generator.generateInvoice(doc, order, fulfillment)
    doc.end()

    // Wait for PDF generation to complete
    await new Promise((resolve) => doc.on('end', resolve))

    try {
      const pdfBuffer = Buffer.concat(chunks)
      const { localPath, s3Url } = await this.saveInvoice(pdfBuffer, folder, fileName)
      
      // If this is a fulfillment invoice, store the information in the database
      if (isFulfillment) {
        await dataSource.query(`
          INSERT INTO fulfillment_invoice (id, fulfillment_id, invoice_url, generated_at, created_at, updated_at)
          VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW(), NOW())
          ON CONFLICT (fulfillment_id) 
          DO UPDATE SET 
            invoice_url = EXCLUDED.invoice_url,
            generated_at = NOW(),
            updated_at = NOW()
        `, [fulfillmentId, s3Url])
      }

      // Return the S3 URL as the primary path
      return s3Url
    } catch (error) {
      console.error('[InvoiceService] Failed to save invoice:', error)
      throw error
    }
  }

  async retrieveInvoice(orderId: string, fulfillmentId?: string): Promise<{ invoice_url: string, generated_at: string } | null> {
    if (fulfillmentId) {
      const [invoice] = await dataSource.query(`
        SELECT invoice_url, generated_at::text
        FROM fulfillment_invoice
        WHERE fulfillment_id = $1
      `, [fulfillmentId])
      
      return invoice || null
    }
    
    // For order invoices, we currently store the URL in order metadata
    const order = await this.orderService_.retrieve(orderId)
    return order.metadata?.invoice_path 
      ? { 
          invoice_url: order.metadata.invoice_path as string, 
          generated_at: new Date(order.updated_at).toISOString() 
        }
      : null
  }
}

export default InvoiceService