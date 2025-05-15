import { AbstractBatchJobStrategy, BatchJobService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const thumbnailMapping: ThumbnailMapping[] = [
    {
      "filename": "batteries.png",
      "category_ids": ["1"],
      "subcategory_ids": null
    },
    // {
    //   "filename": "cables.png",
    //   "category_ids": ["9"],
    //   "subcategory_ids": ["48"]
    // },
    // {
    //   "filename": "iphone.png",
    //   "title_contains": "iphone",
    //   "category_ids": ["9"],
    //   "subcategory_ids": ["27"]
    // }
  ] 

interface ThumbnailMapping {
  filename: string;
  title_contains?: string;
  category_ids?: string[];
  subcategory_ids?: (string | null)[];
}

type InjectedDependencies = {
  manager: EntityManager;
  batchJobService: BatchJobService;
};

class AddProductThumbnailsStrategy extends AbstractBatchJobStrategy {
  static identifier = "add-product-thumbnails-strategy";
  static batchType = "add-product-thumbnails";

  protected readonly manager_: EntityManager;
  protected readonly batchJobService_: BatchJobService;

  constructor({ manager, batchJobService }: InjectedDependencies) {
    super({ manager, batchJobService });
    this.manager_ = manager;
    this.batchJobService_ = batchJobService;
  }

  async preProcessBatchJob(batchJobId: string): Promise<void> {
    const batchJob = await this.batchJobService_.retrieve(batchJobId);

    let stat_descriptors = batchJob.result?.stat_descriptors ?? [];

    let count = 0;
    try {
        const mappings: ThumbnailMapping[] = thumbnailMapping;
        count = mappings.length;
        stat_descriptors = [...stat_descriptors, {
          key: "add-thumbnails-info-mapping-count",
          name: "Mappings to process",
          message: `Found ${count} mapping rules to process.`,
        }];
    } catch (e) {
        console.warn("Could not parse mapping file during preProcess for count.");
        stat_descriptors = [...stat_descriptors, {
          key: "add-thumbnails-warn-parse",
          name: "Pre-processing Warning",
          message: "Could not read or parse mapping file to determine count.",
        }];
    }

    await this.batchJobService_.update(batchJobId, {
      result: {
        count: count, 
        advancement_count: 0, // Initialize advancement
        stat_descriptors: stat_descriptors,
      },
    });
  }

  async processJob(batchJobId: string): Promise<void> {
    let batchJob = await this.batchJobService_.retrieve(batchJobId);
    // Ensure result object exists for updates
    batchJob.result = batchJob.result || { errors: [], stat_descriptors: [] }; 
    batchJob.result.errors = batchJob.result.errors || [];

    console.log(`Batch Job ${batchJobId}: Starting product thumbnail update process...`);


    let mappings: ThumbnailMapping[] = thumbnailMapping;

    if (!process.env.S3_BUCKET || !process.env.S3_REGION) {
        const errorMsg = "Error: S3_BUCKET or S3_REGION environment variables are not set.";
        console.error(errorMsg  + ` for Batch Job ${batchJobId}`);
        batchJob.result.errors.push({ message: errorMsg, code: "S3_CONFIG_MISSING" });
        await this.batchJobService_.update(batchJobId, { result: batchJob.result });
        throw new Error(errorMsg);
    }
    
    let processedCount = batchJob.result.advancement_count || 0;
    const totalMappings = mappings.length;
    // Update total count in batch job if not already set by preprocess or if it changed
    batchJob.result.count = totalMappings;

    console.log("totalMappings", totalMappings);

    for (let i = processedCount; i < totalMappings; i++) {
        const mapping = mappings[i];
        const { filename, title_contains, category_ids, subcategory_ids } = mapping;

        if (!filename) {
            console.warn(`Batch Job ${batchJobId}: Skipping mapping due to missing filename:`, mapping);
            continue;
        }
        
        if (!title_contains && (!category_ids || category_ids.length === 0)) {
            console.warn(`Batch Job ${batchJobId}: Skipping mapping: must have at least 'title_contains' or non-empty 'category_ids'.`, mapping);
            continue;
        }

        const thumbnailUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/thumbnails/${filename}`;

        try {
            const conditions: string[] = [];
            const queryParams: any[] = [thumbnailUrl]; 
            let logIdentifierParts: string[] = [];

            if (title_contains) {
                conditions.push(`title ILIKE $${queryParams.length + 1}`);
                queryParams.push(`%${title_contains}%`);
                logIdentifierParts.push(`title containing '${title_contains}'`);
            }

            if (category_ids && category_ids.length > 0) {
                const catIdPlaceholders = category_ids.map(id => {
                    queryParams.push(id);
                    return `$${queryParams.length}`;
                }).join(', ');
                conditions.push(`category_id IN (${catIdPlaceholders})`);
                logIdentifierParts.push(`category_ids: [${category_ids.join(", ")}]`);

                if (subcategory_ids && subcategory_ids.length > 0) {
                    const subIdStrings: string[] = [];
                    let hasNullSubCategory = false;

                    for (const subId of subcategory_ids) {
                        if (subId === null) {
                            hasNullSubCategory = true;
                        } else if (typeof subId === 'string' && subId.trim() !== '') {
                            subIdStrings.push(subId);
                        }
                    }

                    const subConditionsGroup: string[] = [];
                    if (subIdStrings.length > 0) {
                        const subIdPlaceholders = subIdStrings.map(id => {
                            queryParams.push(id);
                            return `$${queryParams.length}`;
                        }).join(', ');
                        subConditionsGroup.push(`subcategory_id IN (${subIdPlaceholders})`);
                    }

                    if (hasNullSubCategory) {
                        subConditionsGroup.push(`(subcategory_id IS NULL OR subcategory_id = '')`);
                    }

                    if (subConditionsGroup.length > 0) {
                        conditions.push(`(${subConditionsGroup.join(" OR ")})`);
                        logIdentifierParts.push(`subcategory_ids: ${JSON.stringify(subcategory_ids)}`);
                    }
                }
            }

            if (conditions.length === 0) {
                console.warn(`Batch Job ${batchJobId}: Skipping mapping as no valid criteria (this should not happen):`, mapping);
                continue;
            }

            const query = `
                UPDATE "product"
                SET thumbnail = $1
                WHERE ${conditions.join(" AND ")} AND thumbnail IS NULL;
            `;

            console.log("query", query);
            console.log("queryParams", queryParams);
            // Using the injected manager for the transaction
            const result = await this.manager_.query(query, queryParams);

            console.log("result", result);
            const affectedRows = result && result[1] && typeof result[1] === 'number' ? result[1] : 0;
            const logIdentifier = logIdentifierParts.join("; ");
            console.log(`Batch Job ${batchJobId}: (${processedCount + 1}/${totalMappings}) Updated: ${logIdentifier} to ${thumbnailUrl}. Rows: ${affectedRows}`);

            // START VERIFICATION QUERY (Example for the 'batteries.png' case)
            if (filename === "batteries.png" && category_ids && category_ids.includes("1")) { // Be specific to the case you want to check
                try {
                    const verificationQuery = `
                        SELECT COUNT(*) as count
                        FROM "product"
                        WHERE category_id = $1 AND thumbnail = $2;
                    `;
                    const verificationParams = [category_ids.find(id => id === "1"), thumbnailUrl]; // Adapt params as needed
                    const verificationResult = await this.manager_.query(verificationQuery, verificationParams);

                    console.log("verificationResult", verificationResult);
                    
                    const count = verificationResult && verificationResult[0] && verificationResult[0].count;
                    console.log(`Batch Job ${batchJobId}: VERIFICATION for ${filename} & category '1': Found ${count} products with the new thumbnail.`);
                    if (parseInt(count, 10) !== affectedRows) {
                        console.warn(`Batch Job ${batchJobId}: VERIFICATION MISMATCH for ${filename} & category '1'. Affected rows: ${affectedRows}, Verified count: ${count}`);
                    }

                } catch (verificationError) {
                    console.error(`Batch Job ${batchJobId}: VERIFICATION ERROR for ${filename} & category '1': ${verificationError.message}`);
                }
            }
            // END VERIFICATION QUERY

        } catch (error) {
            const criteriaForLog = JSON.stringify({ title_contains, category_ids, subcategory_ids });
            const errorMsg = `Error for mapping (file: ${filename}, criteria: ${criteriaForLog}): ${error.message}`;
            console.error(`Batch Job ${batchJobId}: ${errorMsg}`);
            batchJob.result.errors.push({ message: errorMsg, code: "MAPPING_PROCESSING_ERROR"});
            // Decide if we should stop the whole job or continue
            // For now, we log the error, store it, and continue.
        }
        processedCount++;
        batchJob.result.advancement_count = processedCount;
        await this.batchJobService_.update(batchJobId, {
            result: batchJob.result
        });
    }

    batchJob = await this.batchJobService_.retrieve(batchJobId); // refresh batchJob to get latest state
    batchJob.result = batchJob.result || {};
    batchJob.result.message = `Product thumbnail update process ran. Processed ${processedCount} of ${totalMappings} mappings. Errors: ${batchJob.result.errors ? batchJob.result.errors.length : 0}.`;
    console.log(`Batch Job ${batchJobId}: ${batchJob.result.message}`);
    
    // The AbstractBatchJobStrategy handles setting to complete if processJob finishes without error.
    // We just need to ensure the final result object on the batch job is up-to-date.
    await this.batchJobService_.update(batchJobId, { result: batchJob.result });
    
    // If there were errors during processing individual items, but the job itself didn't critically fail (e.g. file not found)
    // the job will be marked as complete by the base strategy. We could check batchJob.result.errors here
    // and if it has items, explicitly call setFailed. For now, let's assume 'complete' means 'attempted all operations'.
  }

  async buildTemplate(): Promise<string> {
    // This method is typically for batch jobs that support importing/exporting data
    // and need to provide a template file (e.g., a CSV template).
    // For this job, it's not directly applicable in the same way.
    // We must implement it, so we can return an empty string or a message.
    return "";
  }

  // Potentially override other methods like `validateFile` if dealing with file uploads,
  // or `shouldRetryOnProcessingError` if needed.
}

export default AddProductThumbnailsStrategy; 