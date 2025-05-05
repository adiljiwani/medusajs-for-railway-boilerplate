import {
    type ProductService,
    ScheduledJobArgs,
    type ScheduledJobConfig
} from "@medusajs/medusa"
import fs from "fs"
import path from "path"

export const config: ScheduledJobConfig = {
    name: "check-product-images-daily",
    schedule: "0 0 * * *",
    data: {},
}

export default async function handler({
    container,
    data,
    pluginOptions,
}: ScheduledJobArgs) {
    try {
        console.log("Checking product images...")

        const productService: ProductService = container.resolve("productService")
        
        // Get all products
        const products = await productService.list({}, {})

        // Path to attachments folder
        const attachmentsPath = path.join(__dirname, "../../../attachment")
        
        const handlesWithImages = new Set<string>()
        const handlesWithoutImages = new Set<string>()
        
        // Initialize all product handles as not having images
        products.forEach(p => handlesWithoutImages.add(p.handle))

        // Get all numbered folders
        const folders = fs.readdirSync(attachmentsPath)
            .filter(folder => !isNaN(Number(folder)))
        
        for (const folder of folders) {
            const folderPath = path.join(attachmentsPath, folder)
            const files = fs.readdirSync(folderPath)
            
            // Find .jpg files that are numbers
            const imageFiles = files.filter(file => {
                const fileName = path.parse(file).name
                return path.extname(file) === '.jpg' && !isNaN(Number(fileName))
            })

            for (const imageFile of imageFiles) {
                const handle = path.parse(imageFile).name
                if (handlesWithoutImages.has(handle)) {
                    handlesWithImages.add(handle)
                    handlesWithoutImages.delete(handle)
                }
            }
        }

        // Save handles with images to a file
        const handlesWithImagesArray = Array.from(handlesWithImages).sort()
        fs.writeFileSync(
            path.join(__dirname, '../../../handles-with-images.txt'),
            handlesWithImagesArray.join('\n')
        )

        // Save handles without images to a file
        const handlesWithoutImagesArray = Array.from(handlesWithoutImages).sort()
        fs.writeFileSync(
            path.join(__dirname, '../../../handles-without-images.txt'),
            handlesWithoutImagesArray.join('\n')
        )

        console.log("\nProducts WITH matching images:")
        handlesWithImagesArray.forEach(handle => {
            console.log(handle)
        })

        console.log("\nProducts WITHOUT matching images:")
        handlesWithoutImagesArray.forEach(handle => {
            console.log(handle)
        })
        
        console.log("\nSummary:")
        console.log(`Total products in database: ${products.length}`)
        console.log(`Products with matching images: ${handlesWithImages.size}`)
        console.log(`Products without matching images: ${handlesWithoutImages.size}`)
        console.log(`\nResults have been saved to:`)
        console.log(`- handles-with-images.txt`)
        console.log(`- handles-without-images.txt`)
        
    } catch (error) {
        console.error("Error checking images:", error)
        throw error
    }
} 