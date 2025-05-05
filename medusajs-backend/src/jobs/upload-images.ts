import {
    ScheduledJobArgs,
    type ScheduledJobConfig,
} from "@medusajs/medusa"
import fs from "fs"
import path from "path"

const dotenv = require("dotenv");
dotenv.config();

export const config: ScheduledJobConfig = {
    name: "upload-images-daily",
    schedule: "0 0 * * *",
    data: {},
}

function loadValidHandles(): Set<string> {
    const filePath = path.join(__dirname, "../../../handles-with-images.txt")
    const content = fs.readFileSync(filePath, 'utf-8')
    return new Set(content.split('\n').map(line => line.trim()).filter(line => line))
}

async function processDirectory(dirPath: string, manager: any, validHandles: Set<string>) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        
        if (entry.isDirectory()) {
            await processDirectory(fullPath, manager, validHandles)
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.jpg')) {
            const handle = path.parse(entry.name).name
            
            // Skip if handle is not in our valid handles list
            if (!validHandles.has(handle)) {
                console.log(`Skipping ${entry.name} - not in handles list`)
                continue
            }

            const s3Key = `products/${entry.name}`
            const imageUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${s3Key}`

            try {
                // Rest of your existing image processing code...
                const existingImage = await manager.query(
                    `SELECT id FROM "image" WHERE url = $1`,
                    [imageUrl]
                )

                if (existingImage && existingImage.length > 0) {
                    console.log(`Image ${entry.name} already exists, skipping...`)
                    continue
                }

                const imageResult = await manager.query(
                    `INSERT INTO "image" (id, url) 
                     VALUES (gen_random_uuid(), $1) 
                     RETURNING id`,
                    [imageUrl]
                )
                
                if (imageResult && imageResult[0]) {
                    await manager.query(
                        `INSERT INTO "product_images" (product_id, image_id)
                         SELECT p.id, $1
                         FROM "product" p
                         WHERE p.handle = $2`,
                        [imageResult[0].id, handle]
                    )
                    console.log(`Linked image ${entry.name} to product ${handle} successfully`)
                }
            } catch (error) {
                console.error(`Error processing ${entry.name}:`, error.message)
            }
        }
    }
}

export default async function handler({
    container,
    data,
    pluginOptions,
}: ScheduledJobArgs) {
    try {
        console.log("Scheduled job: Starting database update process...");

        const manager = container.resolve("manager")
        const validHandles = loadValidHandles()
        
        console.log(`Loaded ${validHandles.size} valid handles from file`)
        
        const attachmentPath = path.join(__dirname, "../../../attachment")
        await processDirectory(attachmentPath, manager, validHandles)

        console.log("\nDatabase update complete!")
    } catch (error) {
        console.error("Error updating database:", error)
        throw error
    }
}