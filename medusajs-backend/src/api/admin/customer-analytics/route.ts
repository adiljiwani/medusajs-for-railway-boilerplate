import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"
import { authenticate } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Authenticate to get user email
    await authenticate()

    // Get user's email from the users table
    const userResult = await dataSource.query(
      `SELECT email FROM "user" WHERE id = $1`,
      [req.user.userId]
    )

    if (userResult.length === 0) {
      return res.status(403).json({ message: "User not found" })
    }

    const userEmail = userResult[0].email

    // Check if user is authorized to access analytics data
    const result = await dataSource.query(
      `SELECT id FROM authorized_growth_users WHERE email = $1`,
      [userEmail]
    )

    if (result.length === 0) {
      return res.status(403).json({ message: "Not authorized to access analytics data" })
    }

    const { start_date, end_date, customer_id } = req.query

    if (!start_date || !end_date || !customer_id) {
      return res.status(400).json({ message: "Start date, end date, and customer ID are required" })
    }

    // Calculate the earliest date we need (2 years ago for the 1-year previous period)
    const now = new Date()
    const earliestDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)

    // Query to get daily order totals for the customer
    const query = `
      SELECT 
        DATE(o.created_at) as date,
        SUM(li.quantity * li.unit_price) as total_amount
      FROM "order" o
      JOIN "line_item" li ON li.order_id = o.id
      WHERE o.created_at >= $1
      AND o.customer_id = $2
      AND o.status != 'canceled'
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
    `

    const orders = await dataSource.query(query, [earliestDate, customer_id])

    // Calculate date ranges for each period
    const periods = {
      oneWeek: {
        current: {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        },
        previous: {
          start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      oneMonth: {
        current: {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now
        },
        previous: {
          start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      threeMonths: {
        current: {
          start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          end: now
        },
        previous: {
          start: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      sixMonths: {
        current: {
          start: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
          end: now
        },
        previous: {
          start: new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        }
      },
      oneYear: {
        current: {
          start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          end: now
        },
        previous: {
          start: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        }
      }
    }

    // Calculate totals for each period
    const calculatePeriodTotal = (startDate: Date, endDate: Date) => {
      return orders.reduce((total: number, order: any) => {
        const orderDate = new Date(order.date)
        if (orderDate >= startDate && orderDate <= endDate) {
          return total + Number(order.total_amount)
        }
        return total
      }, 0)
    }

    // Calculate data for each period
    const tileData = {
      oneWeek: {
        current: calculatePeriodTotal(periods.oneWeek.current.start, periods.oneWeek.current.end),
        previous: calculatePeriodTotal(periods.oneWeek.previous.start, periods.oneWeek.previous.end)
      },
      oneMonth: {
        current: calculatePeriodTotal(periods.oneMonth.current.start, periods.oneMonth.current.end),
        previous: calculatePeriodTotal(periods.oneMonth.previous.start, periods.oneMonth.previous.end)
      },
      threeMonths: {
        current: calculatePeriodTotal(periods.threeMonths.current.start, periods.threeMonths.current.end),
        previous: calculatePeriodTotal(periods.threeMonths.previous.start, periods.threeMonths.previous.end)
      },
      sixMonths: {
        current: calculatePeriodTotal(periods.sixMonths.current.start, periods.sixMonths.current.end),
        previous: calculatePeriodTotal(periods.sixMonths.previous.start, periods.sixMonths.previous.end)
      },
      oneYear: {
        current: calculatePeriodTotal(periods.oneYear.current.start, periods.oneYear.current.end),
        previous: calculatePeriodTotal(periods.oneYear.previous.start, periods.oneYear.previous.end)
      }
    }

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const percentageChanges = {
      oneWeek: calculatePercentageChange(tileData.oneWeek.current, tileData.oneWeek.previous),
      oneMonth: calculatePercentageChange(tileData.oneMonth.current, tileData.oneMonth.previous),
      threeMonths: calculatePercentageChange(tileData.threeMonths.current, tileData.threeMonths.previous),
      sixMonths: calculatePercentageChange(tileData.sixMonths.current, tileData.sixMonths.previous),
      oneYear: calculatePercentageChange(tileData.oneYear.current, tileData.oneYear.previous)
    }

    // Format data for chart (only use data within the requested date range)
    const chartOrders = orders.filter((o: any) => {
      const orderDate = new Date(o.date)
      const startDate = new Date(start_date as string)
      const endDate = new Date(end_date as string)
      return orderDate >= startDate && orderDate <= endDate
    })

    const labels = chartOrders.map((o: any) => {
      const date = new Date(o.date)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    })

    const orderData = chartOrders.map((o: any) => o.total_amount / 100) // Convert cents to dollars

    return res.json({
      labels,
      payments: orderData,
      tileData: {
        oneWeek: {
          current: tileData.oneWeek.current / 100,
          previous: tileData.oneWeek.previous / 100,
          percentageChange: percentageChanges.oneWeek
        },
        oneMonth: {
          current: tileData.oneMonth.current / 100,
          previous: tileData.oneMonth.previous / 100,
          percentageChange: percentageChanges.oneMonth
        },
        threeMonths: {
          current: tileData.threeMonths.current / 100,
          previous: tileData.threeMonths.previous / 100,
          percentageChange: percentageChanges.threeMonths
        },
        sixMonths: {
          current: tileData.sixMonths.current / 100,
          previous: tileData.sixMonths.previous / 100,
          percentageChange: percentageChanges.sixMonths
        },
        oneYear: {
          current: tileData.oneYear.current / 100,
          previous: tileData.oneYear.previous / 100,
          percentageChange: percentageChanges.oneYear
        }
      }
    })
  } catch (error) {
    console.error("Error in customer analytics API:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
} 