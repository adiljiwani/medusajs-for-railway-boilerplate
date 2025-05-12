import { RadioGroup } from "@headlessui/react"
import { InformationCircleSolid } from "@medusajs/icons"
import { PaymentSession } from "@medusajs/medusa"
import { Text, Tooltip, clx } from "@medusajs/ui"
import React, { useEffect, useState } from "react"

import Radio from "@modules/common/components/radio"

import PaymentTest from "../payment-test"

type PaymentMethodType = {
  id: number
  payment_method: string
}

type PaymentContainerProps = {
  paymentSession: PaymentSession
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  onPaymentMethodSelect?: (methodId: number | null) => void
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentSession,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  onPaymentMethodSelect,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>([])
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null)

  useEffect(() => {
    // Fetch payment method types when component mounts
    const fetchPaymentMethods = async () => {
      try {
        console.log("Fetching payment methods...")
        const response = await fetch("/api/store/payment-methods")
        const data = await response.json()
        console.log("Payment methods response:", data)
        if (data.payment_methods && data.payment_methods.length > 0) {
          setPaymentMethods(data.payment_methods)
          setSelectedMethod(data.payment_methods[0].id)
          onPaymentMethodSelect?.(data.payment_methods[0].id)
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error)
      }
    }

    if (paymentSession.provider_id === "manual") {
      fetchPaymentMethods()
    }
  }, [paymentSession.provider_id])

  const handleMethodChange = async (methodId: number) => {
    setSelectedMethod(methodId)
    onPaymentMethodSelect?.(methodId)

    // Save the selected payment method ID in the payment session data
    try {
      console.log("Saving payment method:", {
        provider_id: paymentSession.provider_id,
        methodId
      })

      const response = await fetch("/api/store/payment-session/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider_id: paymentSession.provider_id,
          data: {
            selected_payment_method_id: methodId
          }
        })
      })

      const result = await response.json()
      console.log("Save payment method response:", result)

      if (!response.ok) {
        throw new Error("Failed to save payment method")
      }
    } catch (error) {
      console.error("Failed to save payment method:", error)
    }
  }

  return (
    <>
      <RadioGroup.Option
        key={paymentSession.id}
        value={paymentSession.provider_id}
        disabled={disabled}
        className={clx(
          "flex flex-col gap-y-2 text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
          {
            "border-ui-border-interactive":
              selectedPaymentOptionId === paymentSession.provider_id,
          }
        )}
      >
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-x-4">
            <Radio
              checked={selectedPaymentOptionId === paymentSession.provider_id}
            />
            <Text className="text-base-regular">
              {paymentInfoMap[paymentSession.provider_id]?.title ||
                paymentSession.provider_id}
            </Text>
            {process.env.NODE_ENV === "development" &&
              !Object.hasOwn(paymentInfoMap, paymentSession.provider_id) && (
                <Tooltip
                  content="You can add a user-friendly name and icon for this payment provider in 'src/modules/checkout/components/payment/index.tsx'"
                  className="min-w-fit"
                >
                  <InformationCircleSolid color="var(--fg-muted)" />
                </Tooltip>
              )}

            {/* {paymentSession.provider_id === "manual" && isDevelopment && (
              <PaymentTest className="hidden small:block" />
            )} */}
          </div>
          <span className="justify-self-end text-ui-fg-base">
            {paymentInfoMap[paymentSession.provider_id]?.icon}
          </span>
        </div>
        {paymentSession.provider_id === "manual" && selectedPaymentOptionId === "manual" && (
          <div className="mt-4 text-small-regular text-ui-fg-subtle">
            <Text className="mb-2">
              Select your preferred payment method:
            </Text>
            <div className="flex flex-col gap-2 ml-4">
              {paymentMethods.map((method) => (
                <label key={method.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="payment-method-type"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={() => handleMethodChange(method.id)}
                  />
                  <span>{method.payment_method}</span>
                </label>
              ))}
            </div>
            <Text className="mt-4">
              After placing your order, you will receive an invoice with payment instructions.
            </Text>
          </div>
        )}
      </RadioGroup.Option>
    </>
  )
}

export default PaymentContainer
