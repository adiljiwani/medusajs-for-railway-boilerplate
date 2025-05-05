import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"

interface PaymentRequestBody {
  amount: number
  payment_method_type: number
  currency_code: string
}

// GET - Fetch payments for an order
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { order_id } = req.params

  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" })
  }

  try {
    const payments = await dataSource.query(
      `SELECT 
        op.*,
        pmt.payment_method
      FROM order_payment op
      LEFT JOIN payment_method_type pmt ON pmt.id = op.payment_method_type
      WHERE op.order_id = $1
      ORDER BY op.created_at DESC`,
      [order_id]
    )

    res.status(200).json({ payments })
  } catch (error) {
    console.error(`[PaymentRoute] Error fetching payments:`, error)
    res.status(500).json({
      message: "Failed to fetch payments",
      error: error.message,
    })
  }
}

// POST - Create a new payment
export async function POST(req: MedusaRequest<PaymentRequestBody>, res: MedusaResponse) {
  const { order_id } = req.params
  const { amount, payment_method_type, currency_code } = req.body

  if (!order_id || !amount || !payment_method_type || !currency_code) {
    return res.status(400).json({
      message: "order_id, amount, payment_method_type, and currency_code are required"
    })
  }

  try {
    // Verify payment method type exists
    const [paymentMethodType] = await dataSource.query(
      `SELECT id FROM payment_method_type WHERE id = $1`,
      [payment_method_type.toString()]
    )

    if (!paymentMethodType) {
      return res.status(404).json({
        message: `Payment method type ${payment_method_type} not found`
      })
    }

    // Create new payment
    const [payment] = await dataSource.query(
      `INSERT INTO order_payment 
        (id, order_id, amount, payment_method_type, currency_code, created_at, updated_at)
       VALUES 
        ('pay_' || substr(md5(random()::text), 0, 27), $1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [order_id, amount.toString(), payment_method_type.toString(), currency_code]
    )

    res.status(201).json({ payment })
  } catch (error) {
    console.error(`[PaymentRoute] Error creating payment:`, error)
    res.status(500).json({
      message: "Failed to create payment",
      error: error.message,
    })
  }
}

// PUT - Update an existing payment
export async function PUT(req: MedusaRequest<PaymentRequestBody>, res: MedusaResponse) {
  const { payment_id } = req.query
  const { amount, payment_method_type, currency_code } = req.body

  if (!payment_id) {
    return res.status(400).json({ message: "Payment ID is required" })
  }

  if (!amount && !payment_method_type && !currency_code) {
    return res.status(400).json({
      message: "At least one of amount, payment_method_type, or currency_code must be provided"
    })
  }

  try {
    // Build update query dynamically based on provided fields
    const updates = []
    const values = [payment_id]
    let valueIndex = 2

    if (amount !== undefined) {
      updates.push(`amount = $${valueIndex}`)
      values.push(amount.toString())
      valueIndex++
    }

    if (payment_method_type !== undefined) {
      // Verify payment method type exists
      const [paymentMethodType] = await dataSource.query(
        `SELECT id FROM payment_method_type WHERE id = $1`,
        [payment_method_type.toString()]
      )

      if (!paymentMethodType) {
        return res.status(404).json({
          message: `Payment method type ${payment_method_type} not found`
        })
      }

      updates.push(`payment_method_type = $${valueIndex}`)
      values.push(payment_method_type.toString())
      valueIndex++
    }

    if (currency_code !== undefined) {
      updates.push(`currency_code = $${valueIndex}`)
      values.push(currency_code)
      valueIndex++
    }

    const [updatedPayment] = await dataSource.query(
      `UPDATE order_payment
       SET ${updates.join(", ")},
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      values
    )

    if (!updatedPayment) {
      return res.status(404).json({
        message: `Payment ${payment_id} not found`
      })
    }

    res.status(200).json({ payment: updatedPayment })
  } catch (error) {
    console.error(`[PaymentRoute] Error updating payment:`, error)
    res.status(500).json({
      message: "Failed to update payment",
      error: error.message,
    })
  }
} 