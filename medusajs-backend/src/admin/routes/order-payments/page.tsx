import type { RouteConfig } from "@medusajs/admin"
import { Container, Heading, Table, Button, Select, DatePicker, Input } from "@medusajs/ui"
import { useAdminOrders } from "medusa-react"
import { CreditCard } from "@medusajs/icons"
import { useEffect, useState } from "react"

const BACKEND_URL = process.env.MEDUSA_ADMIN_BACKEND_URL || "http://localhost:9000"
const ITEMS_PER_PAGE = 50

type PaymentData = {
  payments: Array<{
    id: string
    amount: number
    created_at: string
  }>
}

type SortDirection = 'asc' | 'desc'
type SortField = 'created_at'

const CustomPage = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  
  // Sorting state
  const [sortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Filter state
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [paymentStatus, setPaymentStatus] = useState<string>('all')
  const [minAmount, setMinAmount] = useState<string>('')
  const [maxAmount, setMaxAmount] = useState<string>('')

  const { orders, isLoading: ordersLoading, count } = useAdminOrders({
    expand: "customer,items,payments,shipping_methods,discounts,refunds,region",
    fields: "id,status,created_at,email,display_id,shipping_total,discount_total,tax_total,subtotal,total,refunded_total,paid_total,refundable_amount,gift_card_total,currency_code",
    limit: 1000, // Get all orders to filter client-side
    offset: 0,
    status: ["pending", "completed", "requires_action"],
    order: sortDirection === 'desc' ? '-created_at' : 'created_at',
    created_at: dateRange.from && dateRange.to ? {
      gte: dateRange.from,
      lte: dateRange.to
    } : undefined
  })

  const [paymentData, setPaymentData] = useState<Record<string, PaymentData>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Apply all filters
  const filteredOrders = orders?.filter(order => {
    if (paymentStatus !== 'all') {
      const orderPayments = paymentData[order.id]?.payments || []
      const totalPaid = orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      const isPaid = totalPaid >= (order.total || 0)
      
      if (paymentStatus === 'paid' && !isPaid) return false
      if (paymentStatus === 'unpaid' && isPaid) return false
    }

    if (minAmount && (order.total || 0) < parseFloat(minAmount) * 100) return false
    if (maxAmount && (order.total || 0) > parseFloat(maxAmount) * 100) return false

    return true
  }) || []

  // Calculate total pages based on filtered orders
  const totalFilteredOrders = filteredOrders.length
  const totalPages = Math.max(1, Math.ceil(totalFilteredOrders / ITEMS_PER_PAGE))

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // Get the orders for the current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Update pagination display text
  const paginationText = totalFilteredOrders <= ITEMS_PER_PAGE
    ? `Showing all ${totalFilteredOrders} orders`
    : `Showing ${startIndex + 1} to ${Math.min(startIndex + ITEMS_PER_PAGE, totalFilteredOrders)} of ${totalFilteredOrders} orders`

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!orders) return

      setIsLoading(true)
      const paymentDataMap: Record<string, PaymentData> = {}

      try {
        await Promise.all(
          orders.map(async (order) => {
            const response = await fetch(`${BACKEND_URL}/store/orders/payment/${order.id}/`)
            if (response.ok) {
              const data = await response.json()
              paymentDataMap[order.id] = data
            }
          })
        )
        setPaymentData(paymentDataMap)
      } catch (error) {
        console.error("Error fetching payment data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orders) {
      fetchPaymentData()
    }
  }, [orders])

  const formatAmount = (amount: number | null | undefined, currency: string | null | undefined) => {
    if (amount == null || isNaN(amount)) {
      return `CAD 0.00`
    }
    try {
      const currencyCode = currency?.toUpperCase() || 'CAD'
      return `${currencyCode} ${(amount / 100).toFixed(2)}`
    } catch (e) {
      return `CAD 0.00`
    }
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSort = (field: SortField) => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    // Reset to first page when sorting changes
    setCurrentPage(1)
  }

  const getSortIcon = (field: SortField) => {
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <Container>
      <div className="flex flex-col gap-y-4">
        <Heading level="h1">Order Payments</Heading>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8 bg-white p-6 rounded-lg shadow-sm">
          <Heading level="h2" className="text-xl">Filters</Heading>
          <div className="flex items-end justify-between gap-12">
            <div className="flex-1">
              <label className="text-gray-600 font-medium block mb-2">Date Range</label>
              <div className="flex gap-4">
                <DatePicker 
                  placeholder="From"
                  value={dateRange.from}
                  onChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                />
                <DatePicker 
                  placeholder="To"
                  value={dateRange.to}
                  onChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="text-gray-600 font-medium block mb-2">Payment Status</label>
              <Select 
                value={paymentStatus}
                onValueChange={(value: string) => setPaymentStatus(value)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select payment status">
                    {paymentStatus === 'all' ? 'All' : 
                     paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </Select.Value>
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All</Select.Item>
                  <Select.Item value="paid">Paid</Select.Item>
                  <Select.Item value="unpaid">Unpaid</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-gray-600 font-medium block mb-2">Amount Range</label>
              <div className="flex gap-4">
                <Input 
                  type="number"
                  placeholder="Min Amount"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <Input 
                  type="number"
                  placeholder="Max Amount"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {ordersLoading || isLoading ? (
          <div>Loading orders...</div>
        ) : !displayOrders?.length ? (
          <div>No orders found</div>
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} className="cursor-pointer">
                    Order Date {sortDirection === 'asc' ? '↑' : '↓'}
                  </Table.HeaderCell>
                  <Table.HeaderCell>Number</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                  <Table.HeaderCell>Paid</Table.HeaderCell>
                  <Table.HeaderCell>Balance</Table.HeaderCell>
                  <Table.HeaderCell>Reminder</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {displayOrders.map((order) => {
                  const orderPayments = paymentData[order.id]?.payments || []
                  const totalPaid = orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
                  const orderTotal = order.total
                  const remainingBalance = (orderTotal || 0) - totalPaid
                  
                  return (
                    <Table.Row 
                      key={order.id}
                      className={remainingBalance > 0 ? "bg-red-50" : ""}
                    >
                      <Table.Cell>
                        {order.customer?.first_name || ''} {order.customer?.last_name || ''}
                      </Table.Cell>
                      <Table.Cell>
                        {formatDate(order.created_at)}
                      </Table.Cell>
                      <Table.Cell>#{order.display_id}</Table.Cell>
                      <Table.Cell>
                        {formatAmount(orderTotal, order.currency_code)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatAmount(totalPaid, order.currency_code)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatAmount(remainingBalance, order.currency_code)}
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            alert(`Sending reminder for order #${order.display_id}...`)
                          }}
                        >
                          Send Reminder
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div>
                {paginationText}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  )
}

export const config: RouteConfig = {
  link: {
    label: "Order Payments",
    icon: CreditCard,
  },
}

export default CustomPage 