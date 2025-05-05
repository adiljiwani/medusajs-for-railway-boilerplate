import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import PackingSlipService from "../../../services/packing-slip"

type PackingSlipRequestBody = {
    order_id: string
    fulfillment_id: string
    items: any[]
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const { order_id, fulfillment_id } = req.query

    if (!order_id) {
        return res.status(400).json({
            message: "order_id is required"
        })
    }

    if (!fulfillment_id) {
        return res.status(400).json({
            message: "fulfillment_id is required"
        })
    }

    const packingSlipService: PackingSlipService = req.scope.resolve("packingSlipService")

    try {
        const packingSlip = await packingSlipService.fetchPackingSlip(
            order_id as string, 
            fulfillment_id as string
        )
        
        if (!packingSlip) {
            return res.status(404).json({
                message: "Packing slip not found"
            })
        }

        return res.json({
            slip_url: packingSlip.packing_slip_url,
            generated_at: packingSlip.generated_at
        })
    } catch (error) {
        console.error('[PackingSlipRoute] Error fetching packing slip:', error)
        return res.status(500).json({
            message: "Failed to fetch packing slip",
            error: error.message
        })
    }
}

export const POST = async (req: MedusaRequest<PackingSlipRequestBody>, res: MedusaResponse) => {
    const { order_id, fulfillment_id, items } = req.body

    if (!order_id) {
        return res.status(400).json({
            message: "order_id is required"
        })
    }

    if (!fulfillment_id) {
        return res.status(400).json({
            message: "fulfillment_id is required"
        })
    }

    const packingSlipService: PackingSlipService = req.scope.resolve("packingSlipService")
    const orderService = req.scope.resolve("orderService")

    try {
        // Verify the fulfillment belongs to the order
        const order = await orderService.retrieve(order_id, {
            relations: [
                "fulfillments",
                "items",
                "shipping_address",
                "customer",
                "region"
            ]
        })

        const fulfillment = order.fulfillments?.find(f => f.id === fulfillment_id)
        
        if (!fulfillment) {
            return res.status(404).json({
                message: `Fulfillment ${fulfillment_id} not found in order ${order_id}`
            })
        }

        // Generate the packing slip
        await packingSlipService.generatePackingSlip(
            order_id,
            fulfillment_id,
            items || []
        )

        // Get the updated packing slip details
        const packingSlip = await packingSlipService.fetchPackingSlip(
            order_id,
            fulfillment_id
        )

        if (!packingSlip) {
            return res.status(500).json({
                message: "Failed to retrieve generated packing slip"
            })
        }

        return res.json({
            slip_url: packingSlip.packing_slip_url,
            generated_at: packingSlip.generated_at
        })
    } catch (error: any) {
        console.error('[PackingSlipRoute] Error generating packing slip:', error)
        return res.status(500).json({
            message: "Failed to generate packing slip",
            error: error.message
        })
    }
} 