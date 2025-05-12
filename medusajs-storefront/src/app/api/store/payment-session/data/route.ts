import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(request: NextRequest) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) {
    return NextResponse.json(
      { message: "No cart ID found" },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const { provider_id, data } = body

    const response = await fetch(
      `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/payment-sessions/${provider_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data })
      }
    )

    if (!response.ok) {
      throw new Error("Failed to update payment session data")
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating payment session data:", error)
    return NextResponse.json(
      { message: "Error updating payment session data" },
      { status: 500 }
    )
  }
} 