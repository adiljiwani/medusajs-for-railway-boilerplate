import { useAdminOrder } from "medusa-react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Container, Text, Button, Input, Checkbox, Select } from "@medusajs/ui"
import type { WidgetConfig, WidgetProps } from "@medusajs/admin"
import type { FulfillmentItem, LineItem } from "@medusajs/medusa"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
}

interface PackingSlip {
  slip_url: string
  generated_at: string
}

interface SelectedItem {
  id: string
  quantity: number
}

const PackingSlipWidget = (props: WidgetProps) => {
  const { id } = useParams()
  const { order, isLoading } = useAdminOrder(id!)
  const { notify } = props
  const [packingSlips, setPackingSlips] = useState<Record<string, PackingSlip>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedFulfillment, setSelectedFulfillment] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  useEffect(() => {
    if (order?.fulfillments) {
      const fetchPackingSlips = async () => {
        try {
          const slipData: Record<string, PackingSlip> = {}
          for (const fulfillment of order.fulfillments) {
            const response = await fetch(
              `${BACKEND_URL}/store/packing_slip?order_id=${order.id}&fulfillment_id=${fulfillment.id}`,
              {
                headers: {
                  'x-medusa-access-token': getCookie('_medusa_admin_token') || ''
                }
              }
            )
            if (response.ok) {
              const data = await response.json()
              if (data.slip_url) {
                slipData[fulfillment.id] = data
              }
            }
          }
          setPackingSlips(slipData)
        } catch (error) {
          console.error("Failed to fetch packing slips:", error)
          notify.error("Error", "Failed to fetch packing slips")
        }
      }
      
      fetchPackingSlips()
    }
  }, [order])

  const handleItemSelect = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => {
      if (checked) {
        const orderItem = order?.items.find(item => item.id === itemId)
        if (orderItem) {
          return [...prev, { id: itemId, quantity: 1 }]
        }
      } else {
        return prev.filter(item => item.id !== itemId)
      }
      return prev
    })
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => {
      const itemIndex = prev.findIndex(item => item.id === itemId)
      if (itemIndex > -1) {
        const newItems = [...prev]
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          quantity: Math.max(0, quantity)
        }
        return newItems
      }
      return prev
    })
  }

  const handleGeneratePackingSlip = async () => {
    if (!selectedFulfillment) {
      notify.error("Error", "Please select a fulfillment")
      return
    }

    if (!selectedItems.length) {
      notify.error("Error", "Please select at least one item")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(
        `${BACKEND_URL}/store/packing_slip`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-medusa-access-token': getCookie('_medusa_admin_token') || ''
          },
          body: JSON.stringify({
            order_id: order?.id,
            fulfillment_id: selectedFulfillment,
            items: selectedItems
          }),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to generate packing slip')
      }
      const data = await response.json()
      setPackingSlips(prev => ({
        ...prev,
        [selectedFulfillment]: data
      }))
      notify.success("Success", "Packing slip generated successfully")
    } catch (error) {
      console.error("Failed to generate packing slip:", error)
      notify.error("Error", "Failed to generate packing slip")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewPackingSlip = (slipUrl: string) => {
    window.open(slipUrl, '_blank')
  }

  if (isLoading) {
    return (
      <Container>
        <Text className="text-ui-fg-subtle">Loading...</Text>
      </Container>
    )
  }

  if (!order?.fulfillments || order.fulfillments.length === 0) {
    return (
      <Container>
        <Text className="text-ui-fg-subtle">
          No fulfillments to generate packing slips for.
        </Text>
      </Container>
    )
  }

  return (
    <Container>
      <h3 className="inter-large-semibold mb-4">Packing Slips</h3>
      
      {/* Fulfillment Selection */}
      <div className="mb-6 p-4 border rounded">
        <div className="grid grid-cols-3 gap-x-4 items-center">
          <div>
            <Text className="text-ui-fg-subtle mb-2">Select Fulfillment:</Text>
            <Select
              value={selectedFulfillment || ""}
              onValueChange={(value) => setSelectedFulfillment(value)}
            >
              <Select.Trigger>
                <Select.Value placeholder="Choose a fulfillment..." />
              </Select.Trigger>
              <Select.Content>
                {order.fulfillments.map((fulfillment, index) => (
                  <Select.Item key={fulfillment.id} value={fulfillment.id}>
                    Fulfillment #{index + 1}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div>
            {selectedFulfillment && packingSlips[selectedFulfillment] && (
              <Text className="text-ui-fg-subtle">
                Last generated: {new Date(packingSlips[selectedFulfillment].generated_at).toLocaleString()}
              </Text>
            )}
          </div>

          <div className="flex items-center gap-x-2 justify-end">
            <Button
              variant="primary"
              onClick={handleGeneratePackingSlip}
              disabled={isGenerating || !selectedFulfillment || !selectedItems.length}
              isLoading={isGenerating}
            >
              Generate Packing Slip
            </Button>
            {selectedFulfillment && packingSlips[selectedFulfillment] && (
              <Button
                variant="secondary"
                onClick={() => handleViewPackingSlip(packingSlips[selectedFulfillment].slip_url)}
              >
                View Packing Slip
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-ui-bg-subtle p-4 rounded">
        <Text className="text-ui-fg-subtle mb-2">Select items for packing slip:</Text>
        <div className="grid grid-cols-4 gap-x-4 mb-2 font-medium">
          <Text>Select</Text>
          <Text>Item</Text>
          <Text>SKU</Text>
          <Text>Quantity</Text>
        </div>
        {order.items.map((orderItem: LineItem) => {
          const isSelected = selectedItems.some(item => item.id === orderItem.id)
          const selectedItem = selectedItems.find(item => item.id === orderItem.id)
          
          return (
            <div key={orderItem.id} className="grid grid-cols-4 gap-x-4 py-2 items-center">
              <div>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleItemSelect(orderItem.id, checked as boolean)}
                />
              </div>
              <Text>{String(orderItem.title)}</Text>
              <Text>{String(orderItem.variant?.sku || 'N/A')}</Text>
              <div>
                <Input
                  type="number"
                  value={selectedItem?.quantity || 0}
                  onChange={(e) => handleQuantityChange(orderItem.id, parseInt(e.target.value))}
                  min={0}
                  disabled={!isSelected}
                  className="w-20"
                />
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export const config: WidgetConfig = {
  zone: "order.details.after"
}

export default PackingSlipWidget 