import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { order_id } = req.params

  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" })
  }

  try {
    // First try to get from order_payment_method table
    let [paymentMethod] = await dataSource.query(
      `SELECT pmt.id, pmt.payment_method
       FROM order_payment_method opm
       JOIN payment_method_type pmt ON pmt.id = opm.payment_method_id
       WHERE opm.order_id = $1`,
      [order_id]
    )

    // If not found, try to get from order_payment table
    if (!paymentMethod) {
      [paymentMethod] = await dataSource.query(
        `SELECT pmt.id, pmt.payment_method
         FROM order_payment op
         JOIN payment_method_type pmt ON pmt.id = op.payment_method_type
         WHERE op.order_id = $1
         ORDER BY op.created_at DESC
         LIMIT 1`,
        [order_id]
      )
    }

    if (!paymentMethod) {
      return res.status(404).json({
        message: `Payment method not found for order ${order_id}`
      })
    }

    res.status(200).json({ payment_method: paymentMethod })
  } catch (error) {
    console.error(`[OrderPaymentMethodRoute] Error fetching payment method:`, error)
    res.status(500).json({
      message: "Failed to fetch payment method",
      error: error.message,
    })
  }
} 