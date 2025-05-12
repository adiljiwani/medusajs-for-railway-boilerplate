"use client"

import { useEffect, useState } from "react"
import { Button, Text } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { WidgetConfig, WidgetProps } from "@medusajs/admin"
import { useAdminOrder } from "medusa-react"
import { useParams } from "react-router-dom"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

interface Payment {
  id: string
  amount: number
  payment_method_type: number
  payment_method: string
  currency_code: string
  created_at: string
}

interface PaymentFormData {
  amount: string
  payment_method_type: string
  currency_code: string
}

interface PaymentMethodType {
  value: string
  label: string
}

const PaymentWidget = (props: WidgetProps) => {
  const { id } = useParams()
  const { order, isLoading } = useAdminOrder(id!)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [paymentMethodTypes, setPaymentMethodTypes] = useState<PaymentMethodType[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>()

  // Fetch selected payment method
  useEffect(() => {
    const fetchSelectedPaymentMethod = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/store/orders/${id}/payment-method`)
        const data = await response.json()
        
        if (response.ok && data.payment_method) {
          setSelectedPaymentMethod(data.payment_method.payment_method)
        }
      } catch (error) {
        console.error("Failed to fetch selected payment method:", error)
      }
    }

    if (id) {
      fetchSelectedPaymentMethod()
    }
  }, [id])

  // Fetch payment method types
  useEffect(() => {
    const fetchPaymentMethodTypes = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/store/orders/payment/method-types`)
        const data = await response.json()
        
        if (response.ok) {
          setPaymentMethodTypes(data.payment_method_types)
        } else {
          console.error("Failed to fetch payment method types:", data.message)
          toast.error("Failed to fetch payment method types")
        }
      } catch (error) {
        console.error("Error fetching payment method types:", error)
        toast.error("Error fetching payment method types")
      }
    }

    fetchPaymentMethodTypes()
  }, [])

  // Fetch existing payments
  const fetchPayments = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/store/orders/payment/${id}/`)
      const data = await response.json()
      
      if (response.ok) {
        setPayments(data.payments)
      } else {
        console.error("Failed to fetch payments:", data.message)
        toast.error("Failed to fetch payments")
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("Error fetching payments")
    }
  }

  useEffect(() => {
    if (id) {
      fetchPayments()
    }
  }, [id])

  if (isLoading || !order) {
    return <div>Loading...</div>
  }

  // Calculate total paid and remaining balance
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingBalance = order.total - totalPaid

  // Start editing a payment
  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setValue("amount", (payment.amount / 100).toFixed(2))
    setValue("payment_method_type", String(payment.payment_method_type))
    setValue("currency_code", payment.currency_code)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingPayment(null)
    reset()
  }

  // Handle payment submission (create or update)
  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true)
    try {
      // Convert amount from dollars to cents
      const amountInCents = Math.round(parseFloat(data.amount) * 100)
      
      // When editing, if the amount hasn't changed, use the original amount
      const finalAmount = editingPayment 
        ? (data.amount === (editingPayment.amount / 100).toString() 
          ? editingPayment.amount 
          : amountInCents)
        : amountInCents

      const endpoint = editingPayment 
        ? `${BACKEND_URL}/store/orders/payment/${id}?payment_id=${editingPayment.id}` 
        : `${BACKEND_URL}/store/orders/payment/${id}`

      const response = await fetch(endpoint, {
        method: editingPayment ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: finalAmount,
          payment_method_type: parseInt(data.payment_method_type),
          currency_code: data.currency_code,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(editingPayment ? "Payment updated successfully" : "Payment recorded successfully")
        reset()
        setEditingPayment(null)
        fetchPayments()
      } else {
        toast.error(result.message || (editingPayment ? "Failed to update payment" : "Failed to record payment"))
      }
    } catch (error) {
      console.error(editingPayment ? "Error updating payment:" : "Error recording payment:", error)
      toast.error(editingPayment ? "Error updating payment" : "Error recording payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-8 border border-gray-200 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Payments</h2>

      {/* Selected Payment Method Display */}
      {selectedPaymentMethod && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <Text className="text-sm text-gray-500">Selected Payment Method</Text>
          <Text className="text-lg font-semibold">{selectedPaymentMethod}</Text>
        </div>
      )}

      {/* Order Amount and Balance Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Order Total</div>
            <div className="text-lg font-semibold">{order.currency_code.toUpperCase()} {(order.total / 100).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Paid</div>
            <div className="text-lg font-semibold text-green-600">{order.currency_code.toUpperCase()} {(totalPaid / 100).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Remaining Balance</div>
            <div className="text-lg font-semibold text-blue-600">{order.currency_code.toUpperCase()} {(remainingBalance / 100).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Existing Payments */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Payment History</h3>
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded p-4"
              >
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="font-medium">Amount:</span>{" "}
                    {payment.currency_code.toUpperCase()}{" "}
                    {(payment.amount / 100).toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Method:</span>{" "}
                    {payment.payment_method || "Unknown"}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {new Date(payment.created_at).toLocaleDateString()}
                  </div>
                  <div className="col-span-3 mt-2 flex justify-end">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleEdit(payment)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No payments recorded</div>
        )}
      </div>

      {/* Payment Form */}
      {remainingBalance > 0 || editingPayment ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {editingPayment ? "Edit Payment" : "Record New Payment"}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount (Max: {order.currency_code.toUpperCase()} {(remainingBalance / 100).toFixed(2)})
              </label>
              <input
                type="number"
                step="0.01"
                max={remainingBalance / 100}
                placeholder="Enter price here (in dollars)"
                {...register("amount", { 
                  required: "Amount is required",
                  max: {
                    value: remainingBalance / 100,
                    message: `Amount cannot exceed the remaining balance of ${order.currency_code.toUpperCase()} ${(remainingBalance / 100).toFixed(2)}`
                  },
                  validate: (value) => 
                    parseFloat(value) > 0 || "Amount must be greater than 0"
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                {...register("payment_method_type", {
                  required: "Payment method is required",
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a payment method</option>
                {paymentMethodTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.payment_method_type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.payment_method_type.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency Code
              </label>
              <input
                type="text"
                defaultValue={order.currency_code.toUpperCase()}
                {...register("currency_code", {
                  required: "Currency code is required",
                  pattern: {
                    value: /^[A-Z]{3}$/,
                    message: "Please enter a valid currency code (e.g., USD, CAD)",
                  },
                  validate: (value) => 
                    value === order.currency_code.toUpperCase() || `Currency must match the order currency (${order.currency_code.toUpperCase()})`
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.currency_code && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currency_code.message}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
                variant="primary"
              >
                {isSubmitting 
                  ? (editingPayment ? "Updating Payment..." : "Recording Payment...") 
                  : (editingPayment ? "Update Payment" : "Record Payment")}
              </Button>
              
              {editingPayment && (
                <Button
                  type="button"
                  onClick={handleCancelEdit}
                  variant="secondary"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center p-4 bg-green-50 text-green-700 rounded-lg">
          Order has been fully paid
        </div>
      )}
    </div>
  )
}

export const config: WidgetConfig = {
  zone: "order.details.after"
}

export default PaymentWidget