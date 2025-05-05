import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { order_id } = req.params;
  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" });
  }
  const orderService = req.scope.resolve("orderService");
  try {
    console.log(`[FulfillmentRoute] Fetching fulfillment details for order ID: ${order_id}`);
    
    const order = await orderService.retrieve(order_id, {
      relations: [
        "fulfillments", 
        "fulfillments.items",
        "shipping_methods",
        "shipping_methods.shipping_option"
      ]
    });
    if (!order.fulfillments?.length) {
      return res.status(404).json({ message: "No fulfillments found for the order" });
    }
    // Get the fulfillment shipping price mappings using raw SQL
    const fulfillmentShippingPrices = await dataSource.query(`
      SELECT 
        fsp.*,
        fsp.price as shipping_price
      FROM fulfillment_shipping_price fsp
      WHERE fsp.fulfillment_id = ANY($1)
    `, [order.fulfillments.map(f => f.id)]);
    // Map fulfillments with their corresponding shipping methods
    const fulfillmentsWithShipping = order.fulfillments.map(fulfillment => {
      const mapping = fulfillmentShippingPrices.find(
        fsp => fsp.fulfillment_id === fulfillment.id
      );
      return {
        ...fulfillment,
        shipping_price: mapping?.shipping_price ?? 0
      };
    });
    res.status(200).json({ 
      fulfillments: fulfillmentsWithShipping,
      order_shipping_total: order.shipping_total
    });
  } catch (error) {
    console.error(`[FulfillmentRoute] Error fetching fulfillments:`, error);
    res.status(500).json({
      message: "Failed to fetch fulfillments",
      error: error.message,
    });
  }
} 