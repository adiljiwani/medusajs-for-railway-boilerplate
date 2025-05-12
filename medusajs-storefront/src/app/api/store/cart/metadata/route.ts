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
    const { metadata } = body

    const response = await fetch(
      `${MEDUSA_BACKEND_URL}/store/carts/${cartId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metadata })
      }
    )

    if (!response.ok) {
      throw new Error("Failed to update cart metadata")
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating cart metadata:", error)
    return NextResponse.json(
      { message: "Error updating cart metadata" },
      { status: 500 }
    )
  }
} 