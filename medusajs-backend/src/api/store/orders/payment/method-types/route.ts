import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const paymentMethodTypes = await dataSource.query(
      `SELECT id as value, payment_method as label FROM payment_method_type ORDER BY id`
    )

    res.status(200).json({ payment_method_types: paymentMethodTypes })
  } catch (error) {
    console.error(`[PaymentMethodTypesRoute] Error fetching payment method types:`, error)
    res.status(500).json({
      message: "Failed to fetch payment method types",
      error: error.message,
    })
  }
} 