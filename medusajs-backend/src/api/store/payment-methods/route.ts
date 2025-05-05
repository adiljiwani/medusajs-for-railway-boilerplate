import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("Payment methods route hit")
  try {
    const paymentMethods = await dataSource.query(
      `SELECT id, payment_method FROM payment_method_type ORDER BY id`
    )
    console.log("Found payment methods:", paymentMethods)

    res.status(200).json({ payment_methods: paymentMethods })
  } catch (error) {
    console.error(`[PaymentMethodsRoute] Error fetching payment methods:`, error)
    res.status(500).json({
      message: "Failed to fetch payment methods",
      error: error.message,
    })
  }
} 