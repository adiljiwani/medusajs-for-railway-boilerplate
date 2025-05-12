import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const order_id = searchParams.get("order_id")
  const fulfillment_id = searchParams.get("fulfillment_id")

  if (!order_id) {
    return NextResponse.json(
      { message: "order_id is required" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `${MEDUSA_BACKEND_URL}/store/invoice?order_id=${order_id}&fulfillment_id=${fulfillment_id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      { message: "Error fetching invoice" },
      { status: 500 }
    )
  }
} 