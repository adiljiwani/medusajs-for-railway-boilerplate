import { useState, useEffect } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import type { RouteConfig } from "@medusajs/admin"
import { ChartBar, ArrowUpRightMini } from "@medusajs/icons"
import { Container, Heading, Select, DatePicker } from "@medusajs/ui"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type TimeFrame = "day" | "week" | "month" | "year" | "custom"

// Predefined color palette for chart lines
const chartColors = [
  "#4F46E5", // Indigo
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#84CC16", // Lime
]

const GrowthPage = () => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("week")
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [chartData, setChartData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [tileData, setTileData] = useState<any>({
    oneWeek: null,
    oneMonth: null,
    threeMonths: null,
    sixMonths: null,
    oneYear: null
  })

  const fetchTileData = async (period: string) => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      const previousStartDate = new Date()
      const previousEndDate = new Date()

      // Calculate date ranges based on period
      switch (period) {
        case "oneWeek":
          startDate.setDate(startDate.getDate() - 7)
          previousStartDate.setDate(previousStartDate.getDate() - 14)
          previousEndDate.setDate(previousEndDate.getDate() - 7)
          break
        case "oneMonth":
          startDate.setMonth(startDate.getMonth() - 1)
          previousStartDate.setMonth(previousStartDate.getMonth() - 2)
          previousEndDate.setMonth(previousEndDate.getMonth() - 1)
          break
        case "threeMonths":
          startDate.setMonth(startDate.getMonth() - 3)
          previousStartDate.setMonth(previousStartDate.getMonth() - 6)
          previousEndDate.setMonth(previousEndDate.getMonth() - 3)
          break
        case "sixMonths":
          startDate.setMonth(startDate.getMonth() - 6)
          previousStartDate.setMonth(previousStartDate.getMonth() - 12)
          previousEndDate.setMonth(previousEndDate.getMonth() - 6)
          break
        case "oneYear":
          startDate.setFullYear(startDate.getFullYear() - 1)
          previousStartDate.setFullYear(previousStartDate.getFullYear() - 2)
          previousEndDate.setFullYear(previousEndDate.getFullYear() - 1)
          break
      }

      const response = await fetch(
        `${BACKEND_URL}/admin/growth?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const previousResponse = await fetch(
        `${BACKEND_URL}/admin/growth?start_date=${previousStartDate.toISOString()}&end_date=${previousEndDate.toISOString()}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok || !previousResponse.ok) {
        throw new Error("Failed to fetch data")
      }

      const data = await response.json()
      const previousData = await previousResponse.json()

      const percentageChange = ((data.currentPeriodTotal - previousData.currentPeriodTotal) / previousData.currentPeriodTotal) * 100

      setTileData(prev => ({
        ...prev,
        [period]: {
          current: data.currentPeriodTotal,
          previous: previousData.currentPeriodTotal,
          percentageChange
        }
      }))
    } catch (error) {
      console.error(`Error fetching ${period} data:`, error)
    }
  }

  const fetchChartData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let startDate = new Date()
      let endDate = new Date()

      // Calculate date range based on selected time frame
      switch (timeFrame) {
        case "day":
          startDate.setDate(startDate.getDate() - 1)
          break
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "month":
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        case "custom":
          if (customDateRange.from && customDateRange.to) {
            startDate = customDateRange.from
            endDate = customDateRange.to
          } else {
            return
          }
          break
      }

      const response = await fetch(
        `${BACKEND_URL}/admin/growth?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch data")
      }

      setChartData({
        labels: data.labels,
        datasets: [
          {
            label: "Total Revenue: $",
            data: data.payments,
            borderColor: chartColors[0],
            backgroundColor: `${chartColors[0]}20`,
            tension: 0.4,
            fill: true,
          },
        ],
      })

      setTileData(data.tileData)
    } catch (error) {
      console.error("Error fetching chart data:", error)
      setError(error.message || "Failed to fetch chart data")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when time frame or custom date range changes
  useEffect(() => {
    fetchChartData()
  }, [timeFrame, customDateRange])

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(value)
  }

  if (error) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Heading level="h1" className="text-2xl font-bold mb-4 text-red-600">
              {error}
            </Heading>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex flex-col gap-y-4">
        <Heading level="h1">Growth Analytics</Heading>

        {/* Growth Metrics Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {/* 1 Week Change */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">1 Week</h3>
              {tileData?.oneWeek && (
                <div className={`flex items-center ${tileData.oneWeek.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <ArrowUpRightMini className={`w-4 h-4 ${tileData.oneWeek.percentageChange < 0 ? 'rotate-180' : ''}`} />
                  <span className="ml-1 text-sm font-medium">{formatPercentage(tileData.oneWeek.percentageChange)}</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">
              {tileData?.oneWeek ? formatCurrency(tileData.oneWeek.current) : '...'}
            </div>
            <div className="text-sm text-gray-500">
              vs {tileData?.oneWeek ? formatCurrency(tileData.oneWeek.previous) : '...'}
            </div>
          </div>

          {/* 1 Month Change */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">1 Month</h3>
              {tileData?.oneMonth && (
                <div className={`flex items-center ${tileData.oneMonth.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <ArrowUpRightMini className={`w-4 h-4 ${tileData.oneMonth.percentageChange < 0 ? 'rotate-180' : ''}`} />
                  <span className="ml-1 text-sm font-medium">{formatPercentage(tileData.oneMonth.percentageChange)}</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">
              {tileData?.oneMonth ? formatCurrency(tileData.oneMonth.current) : '...'}
            </div>
            <div className="text-sm text-gray-500">
              vs {tileData?.oneMonth ? formatCurrency(tileData.oneMonth.previous) : '...'}
            </div>
          </div>

          {/* 3 Months Change */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">3 Months</h3>
              {tileData?.threeMonths && (
                <div className={`flex items-center ${tileData.threeMonths.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <ArrowUpRightMini className={`w-4 h-4 ${tileData.threeMonths.percentageChange < 0 ? 'rotate-180' : ''}`} />
                  <span className="ml-1 text-sm font-medium">{formatPercentage(tileData.threeMonths.percentageChange)}</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">
              {tileData?.threeMonths ? formatCurrency(tileData.threeMonths.current) : '...'}
            </div>
            <div className="text-sm text-gray-500">
              vs {tileData?.threeMonths ? formatCurrency(tileData.threeMonths.previous) : '...'}
            </div>
          </div>

          {/* 6 Months Change */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">6 Months</h3>
              {tileData?.sixMonths && (
                <div className={`flex items-center ${tileData.sixMonths.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <ArrowUpRightMini className={`w-4 h-4 ${tileData.sixMonths.percentageChange < 0 ? 'rotate-180' : ''}`} />
                  <span className="ml-1 text-sm font-medium">{formatPercentage(tileData.sixMonths.percentageChange)}</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">
              {tileData?.sixMonths ? formatCurrency(tileData.sixMonths.current) : '...'}
            </div>
            <div className="text-sm text-gray-500">
              vs {tileData?.sixMonths ? formatCurrency(tileData.sixMonths.previous) : '...'}
            </div>
          </div>

          {/* 1 Year Change */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">1 Year</h3>
              {tileData?.oneYear && (
                <div className={`flex items-center ${tileData.oneYear.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <ArrowUpRightMini className={`w-4 h-4 ${tileData.oneYear.percentageChange < 0 ? 'rotate-180' : ''}`} />
                  <span className="ml-1 text-sm font-medium">{formatPercentage(tileData.oneYear.percentageChange)}</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">
              {tileData?.oneYear ? formatCurrency(tileData.oneYear.current) : '...'}
            </div>
            <div className="text-sm text-gray-500">
              vs {tileData?.oneYear ? formatCurrency(tileData.oneYear.previous) : '...'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8 bg-white p-6 rounded-lg shadow-sm">
          <Heading level="h2" className="text-xl">Time Frame</Heading>
          <div className="flex items-end justify-between gap-12">
            <div className="flex-1">
              <Select
                value={timeFrame}
                onValueChange={(value: string) => setTimeFrame(value as TimeFrame)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select time frame">
                    {timeFrame === "day" ? "Last 24 Hours" :
                     timeFrame === "week" ? "Past Week" :
                     timeFrame === "month" ? "Past Month" :
                     timeFrame === "year" ? "Past Year" : "Custom Range"}
                  </Select.Value>
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="day">Last 24 Hours</Select.Item>
                  <Select.Item value="week">Past Week</Select.Item>
                  <Select.Item value="month">Past Month</Select.Item>
                  <Select.Item value="year">Past Year</Select.Item>
                  <Select.Item value="custom">Custom Range</Select.Item>
                </Select.Content>
              </Select>
            </div>

            {timeFrame === "custom" && (
              <div className="flex-1">
                <div className="flex gap-4">
                  <DatePicker
                    placeholder="From"
                    value={customDateRange.from}
                    onChange={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                  />
                  <DatePicker
                    placeholder="To"
                    value={customDateRange.to}
                    onChange={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm min-h-[500px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500">
              <ChartBar className="w-12 h-12 mb-4 text-red-400" />
              <p className="text-lg">Error loading data</p>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : chartData ? (
            <Line
              data={chartData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                interaction: {
                  intersect: false,
                  mode: "index" as const,
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: "Revenue Over Time",
                    font: {
                      size: 16,
                      weight: "bold",
                    },
                    padding: {
                      bottom: 30,
                    },
                  },
                  tooltip: {
                    backgroundColor: "white",
                    titleColor: "black",
                    bodyColor: "black",
                    bodyFont: {
                      size: 13,
                    },
                    titleFont: {
                      size: 13,
                      weight: "bold",
                    },
                    padding: 12,
                    borderColor: "rgb(226, 232, 240)",
                    borderWidth: 1,
                    displayColors: true,
                    usePointStyle: true,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Revenue (CAD)",
                      font: {
                        size: 13,
                        weight: "normal",
                      },
                      padding: 10,
                    },
                    grid: {
                      color: "rgb(241, 245, 249)",
                    },
                    ticks: {
                      font: {
                        size: 12,
                      },
                      padding: 8,
                    },
                  },
                  x: {
                    grid: {
                      color: "rgb(241, 245, 249)",
                    },
                    ticks: {
                      font: {
                        size: 12,
                      },
                      padding: 8,
                      maxRotation: 45,
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <ChartBar className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-lg">No data available</p>
              <p className="text-sm text-gray-400">Select a time frame to view growth data</p>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config: RouteConfig = {
  link: {
    label: "Growth",
    icon: ChartBar,
  },
}

export default GrowthPage 