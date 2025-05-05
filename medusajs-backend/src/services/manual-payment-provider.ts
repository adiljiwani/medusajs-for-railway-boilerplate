import { AbstractPaymentProcessor, PaymentProcessorContext, PaymentProcessorError, PaymentProcessorSessionResponse, PaymentSessionStatus } from "@medusajs/medusa"

class ManualPaymentProcessor extends AbstractPaymentProcessor {
  static identifier = "manual"

  async capturePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { status: PaymentSessionStatus.AUTHORIZED }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<
    | PaymentProcessorError
    | {
        status: PaymentSessionStatus
        data: Record<string, unknown>
      }
  > {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        ...paymentSessionData,
      },
    }
  }

  async cancelPayment(payment: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { status: PaymentSessionStatus.CANCELED }
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorSessionResponse> {
    return {
      session_data: {
        ...context.paymentSessionData,
      },
      update_requests: null,
    }
  }

  async deletePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    return { status: PaymentSessionStatus.CANCELED }
  }

  async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
    return PaymentSessionStatus.AUTHORIZED
  }

  async refundPayment(payment: Record<string, unknown>, refundAmount: number): Promise<Record<string, unknown>> {
    return { status: PaymentSessionStatus.CANCELED }
  }

  async retrievePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    return paymentSessionData
  }

  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorSessionResponse> {
    return {
      session_data: {
        ...context.paymentSessionData,
      },
      update_requests: null,
    }
  }

  async updatePaymentData(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // This is where we ensure the payment session data is preserved
    return {
      ...data,
    }
  }
}

export default ManualPaymentProcessor 