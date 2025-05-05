import { useState, useRef } from "react"
import { Line } from "react-chartjs-2"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
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
import { useAdminProducts } from "medusa-react"
import type { Product } from "@medusajs/medusa"
import { useDebounce } from "../../../hooks/use-debounce"
import { useProductSales } from "./use-product-sales"
import type { RouteConfig } from "@medusajs/admin"
import { ChartBar } from "@medusajs/icons"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type TimeFrame = "week" | "month" | "year" | "custom"

// Predefined color palette for chart lines
const chartColors = [
  "#4F46E5", // Indigo
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
]

const ProductSalesAnalytics = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("week")
  const [customDateRange, setCustomDateRange] = useState<{
    start: string | null
    end: string | null
  }>({
    start: null,
    end: null,
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { products, isLoading: productsLoading } = useAdminProducts({
    q: debouncedSearchTerm,
  })

  const { salesData, isLoading: salesLoading } = useProductSales({
    products: selectedProducts,
    timeFrame,
    customDateRange,
  })

  const chartRef = useRef<HTMLDivElement>(null)

  const exportToPDF = async () => {
    if (!chartRef.current || !salesData) return

    try {
      const canvas = await html2canvas(chartRef.current)
      const imgData = canvas.toDataURL("image/png")
      
      // Initialize PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height]
      })

      // Add the chart image
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)

      // Save the PDF
      pdf.save("product-sales-analytics.pdf")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
    }
  }

  return (
    <div className="flex flex-col gap-y-4 h-full p-6 bg-gray-50">
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Product Sales Analytics</h1>
        {selectedProducts.length > 0 && !salesLoading && salesData && (
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export as PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-y-2 bg-white p-6 rounded-lg shadow-sm">
          <label className="text-gray-700 font-medium mb-2">Search Products</label>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          {productsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700"></div>
            </div>
          ) : (
            <div className="mt-2 max-h-[300px] overflow-y-auto rounded-lg border border-gray-100">
              {products?.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-x-2 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                  onClick={() => {
                    if (!selectedProducts.find((p) => p.id === product.id)) {
                      setSelectedProducts([...selectedProducts, product as Product])
                    }
                  }}
                >
                  <span className="font-medium">{product.title}</span>
                  {product.variants?.[0]?.sku && (
                    <span className="text-gray-500 text-sm">#{product.variants[0].sku}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-y-2 bg-white p-6 rounded-lg shadow-sm">
          <label className="text-gray-700 font-medium mb-2">Time Frame</label>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeFrame === "custom" && (
            <div className="flex gap-x-4 mt-4">
              <div className="flex-1">
                <label className="text-gray-600 text-sm mb-1.5 block">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.start || ""}
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, start: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex-1">
                <label className="text-gray-600 text-sm mb-1.5 block">End Date</label>
                <input
                  type="date"
                  value={customDateRange.end || ""}
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, end: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[500px] bg-white p-6 rounded-lg shadow-sm" ref={chartRef}>
        {salesLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
          </div>
        ) : !selectedProducts.length ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <ChartBar className="w-12 h-12 mb-4 text-gray-400" />
            <p className="text-lg">Select products to view their sales data</p>
            <p className="text-sm text-gray-400">The chart will appear here</p>
          </div>
        ) : salesData ? (
          <Line
            data={{
              ...salesData,
              datasets: salesData.datasets.map((dataset, index) => ({
                ...dataset,
                borderColor: chartColors[index % chartColors.length],
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: "white",
                pointHoverBackgroundColor: chartColors[index % chartColors.length],
                pointBorderColor: chartColors[index % chartColors.length],
                pointBorderWidth: 2,
                pointHoverBorderWidth: 2,
                fill: false,
              })),
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              interaction: {
                intersect: false,
                mode: "index" as const,
              },
              plugins: {
                legend: {
                  position: "top" as const,
                  labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: "circle",
                    font: {
                      size: 12,
                      weight: "normal",
                    },
                  },
                },
                title: {
                  display: true,
                  text: "Product Sales Over Time",
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
                    text: "Units Sold",
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
                    callback: function(value: any, index: number) {
                      const label = this.getLabelForValue(value);
                      
                      try {
                        const date = new Date(label);
                        if (!isNaN(date.getTime())) {
                          const options: Intl.DateTimeFormatOptions = {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          };
                          
                          if (timeFrame === "year") {
                            delete options.day;
                          }
                          
                          return date.toLocaleDateString('en-US', options);
                        }
                      } catch (e) {
                        console.error("Error formatting date:", e);
                      }
                      
                      return label; // Fallback to original label
                    }
                  },
                },
              },
            }}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-lg shadow-sm">
        {selectedProducts.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center gap-x-2 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: `${chartColors[index % chartColors.length]}15`,
              borderColor: chartColors[index % chartColors.length],
              borderWidth: "1px",
            }}
          >
            <span className="font-medium" style={{ color: chartColors[index % chartColors.length] }}>
              {product.title}
            </span>
            <button
              onClick={() =>
                setSelectedProducts(
                  selectedProducts.filter((p) => p.id !== product.id)
                )
              }
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export const config: RouteConfig = {
  link: {
    label: "Product Sales Analytics",
    icon: ChartBar,
  },
}

export default ProductSalesAnalytics 