import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET(
  request: NextRequest,
  { params }: { params: { order_id: string } }
) {
  const { order_id } = params

  try {
    const response = await fetch(
      `${MEDUSA_BACKEND_URL}/store/orders/${order_id}/payment-method`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch payment method")
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching payment method" },
      { status: 500 }
    )
  }
} 