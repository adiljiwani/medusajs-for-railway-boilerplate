import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { dataSource } from "@medusajs/medusa/dist/loaders/database"

type ProvinceOption = {
  name: string
  code: string
  rate: number
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { region_id } = req.query

  if (!region_id) {
    return res.status(400).json({ message: "Region ID is required" })
  }

  try {
    // First, check if we have any tax rates for this region
    const taxRates = await dataSource.query(
      `SELECT name, code, rate
       FROM tax_rate
       WHERE region_id = $1`,
      [region_id]
    )

    // If no tax rates found, return default province options for Canada
    if (!taxRates || taxRates.length === 0) {
      const defaultProvinces: ProvinceOption[] = [
        { name: "Alberta", code: "AB", rate: 0.05 },
        { name: "British Columbia", code: "BC", rate: 0.12 },
        { name: "Manitoba", code: "MB", rate: 0.12 },
        { name: "New Brunswick", code: "NB", rate: 0.15 },
        { name: "Newfoundland and Labrador", code: "NL", rate: 0.15 },
        { name: "Northwest Territories", code: "NT", rate: 0.05 },
        { name: "Nova Scotia", code: "NS", rate: 0.15 },
        { name: "Nunavut", code: "NU", rate: 0.05 },
        { name: "Ontario", code: "ON", rate: 0.13 },
        { name: "Prince Edward Island", code: "PE", rate: 0.15 },
        { name: "Quebec", code: "QC", rate: 0.14975 },
        { name: "Saskatchewan", code: "SK", rate: 0.11 },
        { name: "Yukon", code: "YT", rate: 0.05 }
      ]
      return res.status(200).json(defaultProvinces)
    }

    // Map tax rates to province options format
    const provinceOptions: ProvinceOption[] = taxRates.map(rate => ({
      name: rate.name,
      code: rate.code,
      rate: parseFloat(rate.rate)
    }))

    res.status(200).json(provinceOptions)
  } catch (error) {
    console.error(`[TaxRatesRoute] Error fetching tax rates:`, error)
    res.status(500).json({
      message: "Failed to fetch tax rates",
      error: error.message,
    })
  }
} 