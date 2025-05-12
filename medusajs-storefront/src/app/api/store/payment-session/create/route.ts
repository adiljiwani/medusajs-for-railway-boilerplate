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
    const { provider_id } = body

    // If the payment provider is manual, check if credit card is selected
    if (provider_id === "manual") {
      // First get the cart total
      const cartResponse = await fetch(
        `${MEDUSA_BACKEND_URL}/store/carts/${cartId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!cartResponse.ok) {
        throw new Error("Failed to fetch cart")
      }

      const cart = await cartResponse.json()
      const cartTotal = cart.cart.total

      // Create payment session
      const response = await fetch(
        `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/payment-sessions/${provider_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              surcharge: null, // Will be updated when payment method is selected
              total_with_surcharge: cartTotal
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error("Failed to create payment session")
      }

      const result = await response.json()
      return NextResponse.json(result)
    }

    // For other payment methods, create session without surcharge
    const response = await fetch(
      `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/payment-sessions/${provider_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      }
    )

    if (!response.ok) {
      throw new Error("Failed to create payment session")
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating payment session:", error)
    return NextResponse.json(
      { message: "Error creating payment session" },
      { status: 500 }
    )
  }
} 