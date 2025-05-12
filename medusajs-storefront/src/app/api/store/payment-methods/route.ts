import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET(request: NextRequest) {
  console.log("Client API route hit, fetching from:", `${MEDUSA_BACKEND_URL}/store/payment-methods`)
  try {
    const response = await fetch(
      `${MEDUSA_BACKEND_URL}/store/payment-methods`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const data = await response.json()
    console.log("Response from backend:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json(
      { message: "Error fetching payment methods" },
      { status: 500 }
    )
  }
} 