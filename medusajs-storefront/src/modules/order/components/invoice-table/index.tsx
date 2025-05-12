import { Order } from "@medusajs/medusa"
import { Table } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Heading } from "@medusajs/ui"

type InvoiceTableProps = {
  order: Order
}

interface FulfillmentInvoice {
  invoice_url: string
  generated_at: string
}

const InvoiceTable = ({ order }: InvoiceTableProps) => {
  const [invoices, setInvoices] = useState<Record<string, FulfillmentInvoice>>({})

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoiceData: Record<string, FulfillmentInvoice> = {}
        for (const fulfillment of order.fulfillments) {
          const response = await fetch(
            `/api/store/invoice?order_id=${order.id}&fulfillment_id=${fulfillment.id}`
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

    if (order.fulfillments?.length) {
      fetchInvoices()
    }
  }, [order])

  if (!order.fulfillments?.length) {
    return null
  }

  return (
    <div className="bg-white border-t pt-8">
      <div className="flex flex-col gap-y-4 h-full w-full">
        <div className="flex items-center justify-between">
          <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
            Invoices
          </Heading>
        </div>
        <div className="flex flex-col gap-y-4">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="!pl-0">Fulfillment</Table.HeaderCell>
                <Table.HeaderCell>Invoice</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {order.fulfillments.map((fulfillment, index) => (
                <Table.Row key={fulfillment.id} className="border-b last:border-b-0">
                  <Table.Cell className="!pl-0">Fulfillment #{index + 1}</Table.Cell>
                  <Table.Cell>
                    {invoices[fulfillment.id] ? (
                      <a
                        href={invoices[fulfillment.id].invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline"
                      >
                        View Invoice
                      </a>
                    ) : (
                      <span className="text-ui-fg-subtle">No invoice available</span>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default InvoiceTable 