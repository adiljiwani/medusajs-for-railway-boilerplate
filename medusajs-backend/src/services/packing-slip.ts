import { Lifetime } from "awilix"
import { TransactionBaseService } from "@medusajs/medusa"
import { IEventBusService } from "@medusajs/types"
import { OrderService } from "@medusajs/medusa"
import PDFDocument from "pdfkit"
import AWS from "aws-sdk"
import fs from "fs"
import path from "path"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"
import PackingSlip from "./packing-slip-generator"

class PackingSlipService extends TransactionBaseService {
  static LIFE_TIME = Lifetime.SCOPED
  protected readonly orderService_: OrderService
  private packingSlipGenerator: PackingSlip
  private s3: AWS.S3

  constructor(
    {
      orderService,
    }: {
      orderService: OrderService
    },
    options: Record<string, unknown>
  ) {
    // @ts-ignore
    super(...arguments)
    
    this.orderService_ = orderService
    this.packingSlipGenerator = new PackingSlip()

    // Initialize S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION
    })
  }

  private async savePackingSlip(pdfBuffer: Buffer, orderId: string, fulfillmentId: string): Promise<string> {
    try {
      // Save to S3
      const s3Key = `packing-slips/${orderId}/${fulfillmentId}.pdf`
      const uploadResult = await this.s3.upload({
        Bucket: process.env.S3_BUCKET!,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
      }).promise()

      console.log(`[PackingSlipService] Successfully uploaded packing slip to S3: ${uploadResult.Location}`)

      return uploadResult.Location
    } catch (error) {
      console.error('[PackingSlipService] Failed to save packing slip:', error)
      throw error
    }
  }

  async generatePackingSlip(orderId: string, fulfillmentId: string, items: any[]): Promise<string> {
    console.log(`[PackingSlipService] Starting packing slip generation for order ${orderId}, fulfillment ${fulfillmentId}`)

    try {
      // Get the order with all necessary relations
      const order = await this.orderService_.retrieve(orderId, {
        relations: [
          "items",
          "items.variant",
          "shipping_address",
          "customer",
          "region",
          "fulfillments",
          "fulfillments.items"
        ]
      })

      // Find the specific fulfillment
      const fulfillment = order.fulfillments?.find(f => f.id === fulfillmentId)
      if (!fulfillment) {
        throw new Error(`Fulfillment ${fulfillmentId} not found in order ${orderId}`)
      }

      // Create the PDF document
      const doc = new PDFDocument({ margin: 50 })
      
      // Create a buffer to store the PDF
      const chunks: Buffer[] = []
      doc.on('data', chunks.push.bind(chunks))

      // Generate the packing slip
      await this.packingSlipGenerator.generatePackingSlip(doc, order, fulfillment, items)
      doc.end()

      // Wait for PDF generation to complete
      await new Promise((resolve) => doc.on('end', resolve))

      // Save the packing slip and get the URL
      const pdfBuffer = Buffer.concat(chunks)
      const s3Url = await this.savePackingSlip(pdfBuffer, orderId, fulfillmentId)

      // Store the packing slip URL in the database
      await dataSource.query(`
        INSERT INTO fulfillment_packing_slip (id, fulfillment_id, packing_slip_url, generated_at, created_at, updated_at)
        VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW(), NOW())
        ON CONFLICT (fulfillment_id) 
        DO UPDATE SET 
          packing_slip_url = EXCLUDED.packing_slip_url,
          generated_at = NOW(),
          updated_at = NOW()
      `, [fulfillmentId, s3Url])

      return s3Url
    } catch (error) {
      console.error('[PackingSlipService] Failed to generate packing slip:', error)
      throw error
    }
  }

  async fetchPackingSlip(orderId: string, fulfillmentId: string): Promise<{ packing_slip_url: string, generated_at: string } | null> {
    try {
      const [packingSlip] = await dataSource.query(`
        SELECT packing_slip_url, generated_at::text
        FROM fulfillment_packing_slip
        WHERE fulfillment_id = $1
      `, [fulfillmentId])
      
      return packingSlip || null
    } catch (error) {
      console.error('[PackingSlipService] Failed to fetch packing slip:', error)
      throw error
    }
  }
}

export default PackingSlipService