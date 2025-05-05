import { useAdminOrders } from "medusa-react"
import { useMemo } from "react"
import { Product } from "@medusajs/medusa"

type TimeFrame = "week" | "month" | "year" | "custom"

interface UseProductSalesProps {
  products: Product[]
  timeFrame: TimeFrame
  customDateRange?: {
    start: string | null
    end: string | null
  }
}

export const useProductSales = ({
  products,
  timeFrame,
  customDateRange,
}: UseProductSalesProps) => {
  // Calculate date range based on timeFrame
  const dateRange = useMemo(() => {
    const end = new Date()
    let start = new Date()

    switch (timeFrame) {
      case "week":
        start.setDate(end.getDate() - 7)
        break
      case "month":
        start.setMonth(end.getMonth() - 1)
        break
      case "year":
        start.setFullYear(end.getFullYear() - 1)
        break
      case "custom":
        if (customDateRange?.start && customDateRange?.end) {
          const customStart = new Date(customDateRange.start)
          const customEnd = new Date(customDateRange.end)
          
          // Ensure valid dates
          if (!isNaN(customStart.getTime()) && !isNaN(customEnd.getTime())) {
            return {
              start: customStart,
              end: customEnd,
            }
          }
        }
        // Fallback to last 7 days if custom dates are invalid
        start.setDate(end.getDate() - 7)
        break
    }

    return { start, end }
  }, [timeFrame, customDateRange])

  // Fetch orders within the date range
  const { orders, isLoading } = useAdminOrders({
    created_at: {
      gte: dateRange.start.toISOString(),
      lte: dateRange.end.toISOString(),
    },
    expand: "items,items.variant",
  })

  // Process orders to get sales data for each product
  const salesData = useMemo(() => {
    if (!orders || !products.length) return null

    // Generate date labels based on timeframe
    const labels: string[] = []
    const datasets: {
      label: string
      data: number[]
      borderColor: string
    }[] = []

    // Generate time intervals
    const intervals = getTimeIntervals(dateRange.start, dateRange.end, timeFrame)
    labels.push(...intervals.map((date) => formatDate(date, timeFrame)))

    // Calculate sales for each product
    products.forEach((product) => {
      const productSales = new Array(intervals.length).fill(0)

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.variant?.product_id === product.id) {
            const orderDate = new Date(order.created_at)
            const intervalIndex = findIntervalIndex(
              orderDate,
              intervals,
              timeFrame
            )
            if (intervalIndex !== -1) {
              productSales[intervalIndex] += item.quantity
            }
          }
        })
      })

      datasets.push({
        label: product.title || "Unnamed Product",
        data: productSales,
        borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      })
    })

    return { labels, datasets }
  }, [orders, products, timeFrame, dateRange])

  return {
    salesData,
    isLoading,
  }
}

// Helper functions
function getTimeIntervals(
  start: Date,
  end: Date,
  timeFrame: TimeFrame
): Date[] {
  const intervals: Date[] = []
  let current = new Date(start)

  while (current <= end) {
    intervals.push(new Date(current))
    switch (timeFrame) {
      case "week":
        current.setDate(current.getDate() + 1)
        break
      case "month":
        current.setDate(current.getDate() + 1)
        break
      case "year":
        current.setDate(current.getDate() + 7)
        break
      case "custom":
        current.setDate(current.getDate() + 1)
        break
    }
  }

  return intervals
}

function formatDate(date: Date, timeFrame: TimeFrame): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }

  if (timeFrame === "year") {
    options.day = undefined
  }

  return date.toLocaleDateString("en-US", options)
}

function findIntervalIndex(
  date: Date,
  intervals: Date[],
  timeFrame: TimeFrame
): number {
  return intervals.findIndex((interval, index) => {
    const next = intervals[index + 1]
    if (!next) return true

    return date >= interval && date < next
  })
} 