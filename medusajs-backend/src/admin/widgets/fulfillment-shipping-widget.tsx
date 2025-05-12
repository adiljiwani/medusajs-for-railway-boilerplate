import { useAdminOrder } from "medusa-react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Container, Text, Input, Button, Table } from "@medusajs/ui"
import type { WidgetConfig, WidgetProps } from "@medusajs/admin"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
}

interface FulfillmentInvoice {
  invoice_url: string
  generated_at: string
}

const FulfillmentShippingWidget = (props: WidgetProps) => {
  const { id } = useParams()
  const { order, isLoading } = useAdminOrder(id!)
  const { notify } = props
  const [shippingPrices, setShippingPrices] = useState<Record<string, string>>({})
  const [savedPrices, setSavedPrices] = useState<Record<string, boolean>>({})
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({})
  const [invoices, setInvoices] = useState<Record<string, FulfillmentInvoice>>({})
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (order?.fulfillments) {
      const fetchShippingPrices = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/store/orders/fulfillment/${order.id}`)
          const data = await response.json()
          
          const prices: Record<string, string> = {}
          const saved: Record<string, boolean> = {}
          const initialPlaceholders: Record<string, string> = {}
          
          data.fulfillments.forEach(fulfillment => {
            prices[fulfillment.id] = ""
            saved[fulfillment.id] = true
            // Convert cents to dollars for display
            const priceInDollars = fulfillment.shipping_price 
              ? (fulfillment.shipping_price / 100).toFixed(2)
              : "Enter shipping price"
            initialPlaceholders[fulfillment.id] = priceInDollars
          })
          
          setShippingPrices(prices)
          setSavedPrices(saved)
          setPlaceholders(initialPlaceholders)
        } catch (error) {
          console.error("Failed to fetch shipping prices:", error)
        }
      }

      const fetchInvoices = async () => {
        try {
          const invoiceData: Record<string, FulfillmentInvoice> = {}
          for (const fulfillment of order.fulfillments) {
            const response = await fetch(
              `${BACKEND_URL}/store/invoice?order_id=${order.id}&fulfillment_id=${fulfillment.id}`,
              {
                headers: {
                  'x-medusa-access-token': getCookie('_medusa_admin_token') || ''
                }
              }
            )
            if (response.ok) {
              const data = await response.json()
              if (data.invoice_url) {
                invoiceData[fulfillment.id] = data
              }
            }
          }
          setInvoices(invoiceData)
        } catch (error) {
          console.error("Failed to fetch invoices:", error)
        }
      }
      
      fetchShippingPrices()
      fetchInvoices()
    }
  }, [order])

  const handleInputChange = (fulfillmentId: string, value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setShippingPrices(prev => ({
        ...prev,
        [fulfillmentId]: value
      }))
      setSavedPrices(prev => ({
        ...prev,
        [fulfillmentId]: false
      }))
    }
  }

  const handleSave = async (fulfillmentId: string) => {
    try {
      // Convert price from dollars to cents
      const priceInCents = Math.round(parseFloat(shippingPrices[fulfillmentId]) * 100)
      const response = await fetch(
        `${BACKEND_URL}/store/orders/fulfillment/${order?.id}/shipping`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-medusa-access-token': getCookie('_medusa_admin_token') || ''
          },
          body: JSON.stringify({
            fulfillment_id: fulfillmentId,
            shipping_method_id: order?.shipping_methods[0]?.id,
            price: priceInCents
          }),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to update shipping price')
      }
      // Update placeholder with the newly saved price (keep as decimal for display)
      setPlaceholders(prev => ({
        ...prev,
        [fulfillmentId]: shippingPrices[fulfillmentId]
      }))
      
      setShippingPrices(prev => ({
        ...prev,
        [fulfillmentId]: ""
      }))
      setSavedPrices(prev => ({
        ...prev,
        [fulfillmentId]: true
      }))
      
      notify.success("Success", "Shipping price saved successfully")
    } catch (error) {
      console.error("Failed to save shipping price:", error)
      notify.error("Error", "Failed to save shipping price")
    }
  }

  const handleGenerateInvoice = async (fulfillmentId: string) => {
    setIsGenerating(prev => ({ ...prev, [fulfillmentId]: true }))
    try {
      const response = await fetch(
        `${BACKEND_URL}/store/invoice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-medusa-access-token': getCookie('_medusa_admin_token') || ''
          },
          body: JSON.stringify({
            order_id: order?.id,
            fulfillment_id: fulfillmentId
          }),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to generate invoice')
      }
      const data = await response.json()
      setInvoices(prev => ({
        ...prev,
        [fulfillmentId]: data
      }))
      notify.success("Success", "Invoice generated successfully")
    } catch (error) {
      console.error("Failed to generate invoice:", error)
      notify.error("Error", "Failed to generate invoice")
    } finally {
      setIsGenerating(prev => ({ ...prev, [fulfillmentId]: false }))
    }
  }

  const handleViewInvoice = (invoiceUrl: string) => {
    window.open(invoiceUrl, '_blank')
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!order?.fulfillments || order.fulfillments.length === 0) {
    return (
      <Container>
        <Text className="text-ui-fg-subtle">
          No fulfillment to enter shipping price for.
        </Text>
      </Container>
    )
  }

  return (
    <Container>
      <h3 className="inter-large-semibold mb-4">Fulfillment Shipping & Invoices</h3>
      <div className="flex flex-col gap-y-4">
        {order.fulfillments.map((fulfillment, index) => (
          <div key={fulfillment.id} className="flex flex-col gap-y-2 border p-4 rounded">
            <div className="grid grid-cols-3 gap-x-4 mb-4">
              {/* Column 1: Fulfillment Number */}
              <div>
                <Text className="text-ui-fg-subtle">
                  Fulfillment #{index + 1}
                </Text>
              </div>

              {/* Column 2: Price Input and Save */}
              <div className="flex items-center gap-x-2">
                <Input
                  type="text"
                  value={shippingPrices[fulfillment.id] || ""}
                  onChange={(e) => handleInputChange(fulfillment.id, e.target.value)}
                  className={savedPrices[fulfillment.id] ? "text-ui-fg-subtle" : ""}
                  placeholder={placeholders[fulfillment.id]}
                />
                <Button
                  variant="secondary"
                  onClick={() => handleSave(fulfillment.id)}
                  disabled={savedPrices[fulfillment.id]}
                >
                  Save
                </Button>
              </div>

              {/* Column 3: Invoice Actions */}
              <div className="flex items-center gap-x-2 justify-end">
                <Button
                  variant="primary"
                  onClick={() => handleGenerateInvoice(fulfillment.id)}
                  disabled={isGenerating[fulfillment.id]}
                  isLoading={isGenerating[fulfillment.id]}
                >
                  Generate Invoice
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleViewInvoice(invoices[fulfillment.id]?.invoice_url)}
                  disabled={!invoices[fulfillment.id]}
                >
                  View Invoice
                </Button>
              </div>
            </div>
            
            {/* Last Generated Text */}
            {invoices[fulfillment.id] && (
              <div className="mb-4">
                <Text className="text-ui-fg-subtle">
                  Last generated at: {new Date(invoices[fulfillment.id].generated_at).toLocaleString()}
                </Text>
              </div>
            )}
            
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>SKU</Table.HeaderCell>
                  <Table.HeaderCell>Quantity</Table.HeaderCell>
                  <Table.HeaderCell>Unit Price</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {fulfillment.items.map((fulfillmentItem) => {
                  const orderItem = order.items.find(item => item.id === fulfillmentItem.item_id)
                  if (!orderItem) return null
                  
                  return (
                    <Table.Row key={`${fulfillmentItem.item_id}-${fulfillmentItem.quantity}`}>
                      <Table.Cell>{orderItem.title}</Table.Cell>
                      <Table.Cell>{orderItem.variant?.sku || 'N/A'}</Table.Cell>
                      <Table.Cell>{fulfillmentItem.quantity}</Table.Cell>
                      <Table.Cell>
                        ${(orderItem.unit_price / 100).toFixed(2)}
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config: WidgetConfig = {
  zone: "order.details.after"
}

export default FulfillmentShippingWidget
