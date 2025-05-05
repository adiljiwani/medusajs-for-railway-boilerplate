import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"

type ShippingRequestBody = {
    fulfillment_id: string
    shipping_method_id: string
    price: number
}

export const POST = async (req: MedusaRequest<ShippingRequestBody>, res: MedusaResponse) => {
    const { order_id } = req.params;
    const { fulfillment_id, shipping_method_id, price } = req.body;

    if (!order_id || !fulfillment_id || !shipping_method_id || price === undefined) {
        return res.status(400).json({
            message: "order_id, fulfillment_id, shipping_method_id, and price are required"
        });
    }

    const orderService = req.scope.resolve("orderService");

    try {
        // Verify order and fulfillment exist
        const order = await orderService.retrieve(order_id, {
            relations: ["fulfillments", "shipping_methods"]
        });

        const fulfillment = order.fulfillments.find(f => f.id === fulfillment_id);
        if (!fulfillment) {
            return res.status(404).json({
                message: `Fulfillment ${fulfillment_id} not found in order ${order_id}`
            });
        }

        // Check if fulfillment_shipping_price entry already exists
        const existingEntry = await dataSource.query(
            `SELECT * FROM fulfillment_shipping_price WHERE fulfillment_id = $1`,
            [fulfillment_id]
        );

        if (existingEntry.length > 0) {
            // Update existing entry
            await dataSource.query(
                `UPDATE fulfillment_shipping_price SET price = $1 WHERE fulfillment_id = $2`,
                [price, fulfillment_id]
            );

            // Subtract existing entry price from shipping method price
            await dataSource.query(
                `UPDATE shipping_method SET price = price - $1 WHERE id = $2`,
                [existingEntry[0].price, shipping_method_id]
            );
        } else {
            // Add new entry
            await dataSource.query(
                `INSERT INTO fulfillment_shipping_price (fulfillment_id, price) VALUES ($1, $2)`,
                [fulfillment_id, price]
            );
        }

        // Add price to shipping method
        await dataSource.query(
            `UPDATE shipping_method SET price = price + $1 WHERE id = $2`,
            [price, shipping_method_id]
        );

        res.status(200).json({
            fulfillment_id,
            shipping_method_id: shipping_method_id,
            price
        });
    } catch (error) {
        console.error(`[ShippingRoute] Error handling shipping method:`, error);
        res.status(500).json({
            message: "Failed to handle shipping method",
            error: error.message,
        });
    }
}