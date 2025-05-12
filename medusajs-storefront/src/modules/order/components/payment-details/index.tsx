"use client"

import { Order } from "@medusajs/medusa"
import { Container, Heading, Text } from "@medusajs/ui"
import { formatAmount } from "@lib/util/prices"
import { useEffect, useState } from "react"

import { paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"

type PaymentDetailsProps = {
  order: Order
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payments[0]
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchPaymentMethod = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/store/orders/${order.id}/payment-method`)
        const data = await response.json()
        
        if (response.ok && data.payment_method) {
          setPaymentMethod(data.payment_method.payment_method)
        }
      } catch (error) {
        console.error("Failed to fetch payment method:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (payment?.provider_id === "manual") {
      fetchPaymentMethod()
    }
  }, [order.id, payment?.provider_id])

  const getPaymentMethodDisplay = () => {
    if (!payment) return null
    
    if (payment.provider_id === "manual") {
      if (isLoading) return "Loading payment method..."
      return paymentMethod || "Manual payment"
    }
    
    return paymentInfoMap[payment.provider_id]?.title || payment.provider_id
  }

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Payment
      </Heading>
      <div>
        {payment && (
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text className="txt-medium text-ui-fg-subtle" data-testid="payment-method">
                {getPaymentMethodDisplay()}
              </Text>
            </div>
            {/* <div className="flex flex-col w-2/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment details
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {paymentInfoMap[payment.provider_id].icon}
                </Container>
                <Text data-testid="payment-amount">
                  {payment.provider_id === "stripe" && payment.data.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${formatAmount({
                        amount: payment.amount,
                        region: order.region,
                        includeTaxes: false,
                      })} paid at ${new Date(payment.created_at).toString()}`}
                </Text>
              </div>
            </div> */}
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
