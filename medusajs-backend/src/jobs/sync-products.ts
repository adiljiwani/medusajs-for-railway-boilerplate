import {
    type ProductService,
    ProductStatus,
    ProductVariantService,
    ScheduledJobArgs,
    type ScheduledJobConfig
} from "@medusajs/medusa"
import axios from "axios";
import {
    CreateProductInput,
    CreateProductProductVariantInput,
    FindProductConfig
} from "@medusajs/medusa/dist/types/product";
import {Product} from "@medusajs/medusa/dist/models";

const dotenv = require("dotenv");
dotenv.config();

interface BngApiProduct {
    upcCode: string;
    productName: string;
    quantity: number;
    price: number;
}

interface UpcToProductIdMapEntry {
    id: string;
}

export const config: ScheduledJobConfig = {
    name: "sync-inventory",
    schedule: "0 * * * *", // Run at minute 0 of every hour
    data: {},
}

export default async function handler({
  container,
  data,
  pluginOptions,
}: ScheduledJobArgs){
    try {
        console.log("Scheduled job: Fetching product info from external API...");

        let bngApiProducts: BngApiProduct[] = [];

        const headers = {
            'APIKey': process.env.BNG_API_KEY,
        };
        try {
            const response = await axios.get('http://services.batteriesnthings.net/api/v1/inventory', { headers });
            bngApiProducts = response.data.data as BngApiProduct[];
        } catch(error) {
            console.error(`Failed to get products from BNG API:`, error.message);
        }

        console.log("Total product count from BNG API: ", bngApiProducts.length);

        const productService: ProductService = container.resolve("productService");
        const productVariantService: ProductVariantService = container.resolve("productVariantService");

        let hasMore = true;
        let offset = 0;
        const limit = 100;
        const currentProducts: Product[] = [];

        while (hasMore) {
            const findProductConfig: FindProductConfig = {
                skip: offset,
                take: limit,
            };

            const batchProducts = await productService.list( {}, findProductConfig)

            currentProducts.push(...batchProducts);

            if (batchProducts && batchProducts.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }
        }

        let numUpdatedProducts = 0;

        const upcCodeToProductIdMap: { [id: string]: UpcToProductIdMapEntry } = {};

        currentProducts.forEach(product => {
            const normalizedHandle = product.handle.trim();
            upcCodeToProductIdMap[normalizedHandle] = {
                id: product.id
            };
        })

        for (const product of bngApiProducts) {
            let upcToProductIdMapEntry = upcCodeToProductIdMap[product.upcCode.trim()];
            if (upcToProductIdMapEntry) {
                // Product exists in the Medusa database
                let newQuantity = product.quantity;

                let productVariants = await productService.retrieveVariants(upcToProductIdMapEntry.id);
                for (const variant of productVariants) {
                    let currentQuantity = variant.inventory_quantity;

                    if (newQuantity != currentQuantity) {
                        try {
                            await productVariantService.update(variant.id, { inventory_quantity: newQuantity });
                        } catch (error) {
                            console.error(`Failed to update variant ${variant.id}:`, error.message);
                        }
                        numUpdatedProducts ++;
                        console.log("Updated product: ", product.productName, ", Old quantity: ", currentQuantity, ", New quantity: ", newQuantity);
                    }
                }
            } else {
                // Product does not exist in Medusa database
                console.log("New product: ", product.productName, "upc: ", product.upcCode)
                try {
                    let newProductVariantInput: CreateProductProductVariantInput = {
                        title: "One size",
                        inventory_quantity: product.quantity,
                        prices: [
                            {
                                currency_code: "CAD",
                                amount: Math.round(product.price * 100)
                            }
                        ]
                    }
                    let newProductData: CreateProductInput = {
                        title: product.productName,
                        handle: product.upcCode.trim(),
                        status: ProductStatus.PUBLISHED,
                        variants: [newProductVariantInput]
                    }
                    const newProduct = await productService.create(newProductData);
                    console.log("New product created:", newProduct);
                } catch (error) {
                    console.error("Failed to create product:", error.message);
                }
            }
        }

        console.log("Total current products: ", currentProducts.length);
        console.log("Number of products with updated quantity", numUpdatedProducts);
    } catch (error) {
        console.error("Error occurred during scheduled job execution:", error);
    }
}
