import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET() {
  const startTime = Date.now()
  const headersList = headers()
  
  try {
    // Log request details
    console.log("=== Health Check Request Details ===")
    console.log("Timestamp:", new Date().toISOString())
    console.log("Request Headers:", Object.fromEntries(headersList.entries()))
    console.log("Environment:", process.env.NODE_ENV)
    console.log("PORT:", process.env.PORT)
    console.log("Host:", headersList.get("host"))
    console.log("User Agent:", headersList.get("user-agent"))

    // System information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
      port: process.env.PORT,
    }
    console.log("System Info:", systemInfo)

    const response = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      responseTime: `${Date.now() - startTime}ms`,
      systemInfo
    }

    console.log("Health check response:", response)
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`
    }
    
    console.error("=== Health Check Error ===")
    console.error("Error Details:", errorDetails)
    console.error("Request Headers:", Object.fromEntries(headersList.entries()))
    console.error("Environment:", process.env.NODE_ENV)
    console.error("PORT:", process.env.PORT)
    
    return NextResponse.json(
      { 
        status: "unhealthy",
        error: errorDetails,
        timestamp: new Date().toISOString()
      }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      }
    )
  }
} 