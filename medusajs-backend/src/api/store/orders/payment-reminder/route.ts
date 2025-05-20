import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[PaymentReminder] Starting payment reminder request");
  const { order_id } = req.body as { order_id: string };

  if (!order_id) {
    console.log("[PaymentReminder] Error: Order ID is missing");
    return res.status(400).json({ message: "Order ID is required" });
  }

  console.log(`[PaymentReminder] Processing reminder for order ID: ${order_id}`);
  const orderService = req.scope.resolve("orderService");
  const sendgridService = req.scope.resolve("sendgridService");

  try {
    // Retrieve order with customer details
    console.log("[PaymentReminder] Retrieving order details...");
    const order = await orderService.retrieve(order_id, {
      relations: ["customer"],
    });

    if (!order) {
      console.log(`[PaymentReminder] Error: Order not found for ID: ${order_id}`);
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.customer?.email) {
      console.log(`[PaymentReminder] Error: No customer email found for order: ${order_id}`);
      return res.status(400).json({ message: "Customer email not found" });
    }

    console.log("[PaymentReminder] Order details retrieved:", {
      order_id: order.id,
      display_id: order.display_id,
      customer_email: order.customer.email,
      customer_name: order.customer.first_name
    });

    // Send payment reminder email
    console.log("[PaymentReminder] Sending email with template:", process.env.SENDGRID_PAYMENT_REMINDER_TEMPLATE);
    await sendgridService.sendEmail({
      templateId: process.env.SENDGRID_PAYMENT_REMINDER_TEMPLATE,
      from: process.env.SENDGRID_FROM,
      to: order.customer.email,
      dynamic_template_data: {
        first_name: order.customer.first_name || "there",
        order_number: order.display_id,
      },
    });

    console.log("[PaymentReminder] Email sent successfully");
    return res.status(200).json({ message: "Payment reminder email sent successfully" });
  } catch (error) {
    console.error("[PaymentReminder] Error sending payment reminder email:", error);
    return res.status(500).json({ message: "Error sending payment reminder email" });
  }
} 