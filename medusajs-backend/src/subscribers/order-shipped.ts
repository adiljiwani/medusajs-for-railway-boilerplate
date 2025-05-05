import dotenv from "dotenv";
import { 
  type SubscriberConfig, 
  type SubscriberArgs,
  OrderService,
  FulfillmentService,
} from "@medusajs/medusa";

dotenv.config();

export default async function handleShipmentCreated({
  data,
  eventName,
  container,
  pluginOptions,
}: SubscriberArgs<Record<string, string>>) {
  const fulfillmentService = container.resolve("fulfillmentService");
  const orderService: OrderService = container.resolve("orderService");
  const sendGridService = container.resolve("sendgridService");

  try {
    console.log("Event Data:", JSON.stringify(data, null, 2));

    // Retrieve the fulfillment using the fulfillment_id
    const fulfillment = await fulfillmentService.retrieve(data.fulfillment_id, {
      relations: ["order", "items", "items.item", "items.item.variant", "tracking_links"],
    });

    if (!fulfillment) {
      console.error(`Fulfillment with ID ${data.fulfillment_id} not found.`);
      return;
    }

    const orderId = fulfillment.order_id;
    if (!orderId) {
      console.error(`Order ID not found for fulfillment ID ${data.fulfillment_id}.`);
      return;
    }

    // Retrieve the order associated with the fulfillment
    const order = await orderService.retrieve(orderId, {
      relations: ["customer"],
    });

    if (!order) {
      console.error(`Order with ID ${orderId} not found.`);
      return;
    }

    // Extract customer's first name
    const customerFirstName = order.customer?.first_name ?? "Valued Customer";

    // Prepare email data for this specific shipment
    const shippedItems = fulfillment.items.map((fulfillmentItem) => ({
      item: {
        title: fulfillmentItem.item.title,
        variant: {
          sku: fulfillmentItem.item.variant?.sku ?? "N/A",
        },
      },
      quantity: fulfillmentItem.quantity,
    }));

    const trackingLinks = fulfillment.tracking_links.map((link) => ({
      number: link.tracking_number
    }));

    const emailData = {
      first_name: customerFirstName,
      order_number: order.display_id,
      shipped_date: fulfillment.shipped_at?.toISOString().split("T")[0] ?? "Unknown",
      tracking_links: trackingLinks,
      items: shippedItems,
    };

    console.log("Email Data:", JSON.stringify(emailData, null, 2));

    // Send email
    await sendGridService.sendEmail({
      templateId: process.env.SENDGRID_ORDER_SHIPPED_TEMPLATE,
      from: process.env.SENDGRID_FROM,
      to: order.customer.email,
      dynamic_template_data: emailData,
    });

    console.log("Shipment email sent successfully!");
  } catch (error) {
    console.error("Error sending shipment email:", error);
  }
}

export const config: SubscriberConfig = {
  event: OrderService.Events.SHIPMENT_CREATED,
  context: {
    subscriberId: "order-shipped-handler",
  },
};