import {
  AbstractTaxService,
  ItemTaxCalculationLine,
  ShippingTaxCalculationLine,
  TaxCalculationContext,
  TaxRateService,
} from "@medusajs/medusa"
import {
  ProviderTaxLine,
} from "@medusajs/medusa/dist/types/tax-service"

type InjectedDependencies = {
  taxRateService: TaxRateService
}

class ProvinceTaxProvider extends AbstractTaxService {
  static identifier = "province-tax-provider"
  protected readonly taxRateService_: TaxRateService

  constructor({ taxRateService }: InjectedDependencies) {
    super(arguments[0])
    this.taxRateService_ = taxRateService
  }

  async getTaxLines(
    itemLines: ItemTaxCalculationLine[],
    shippingLines: ShippingTaxCalculationLine[],
    context: TaxCalculationContext
  ): Promise<ProviderTaxLine[]> {
    const { shipping_address } = context
    if (!shipping_address?.province) {
      return this.getDefaultTaxLines(itemLines, shippingLines)
    }

    try {
      // Get tax rates for the region
      const taxRates = await this.taxRateService_.list({
        region_id: context.region.id
      })

      // Find the tax rate that matches the province code
      const provinceTaxRate = taxRates.find(
        rate => rate.code?.toUpperCase() === shipping_address.province?.toUpperCase()
      )

      if (!provinceTaxRate) {
        return this.getDefaultTaxLines(itemLines, shippingLines)
      }

      // Create tax lines for items
      const taxLines: ProviderTaxLine[] = itemLines.map((line) => ({
        rate: provinceTaxRate.rate,
        name: provinceTaxRate.name || `${shipping_address.province} Tax`,
        code: provinceTaxRate.code || shipping_address.province,
        item_id: line.item.id
      }))

      // Create tax lines for shipping methods if they exist
      if (shippingLines?.length) {
        const shippingTaxLines = shippingLines.map((line) => ({
          rate: provinceTaxRate.rate,
          name: provinceTaxRate.name || `${shipping_address.province} Tax`,
          code: provinceTaxRate.code || shipping_address.province,
          shipping_method_id: line.shipping_method.id
        }))
        taxLines.push(...shippingTaxLines)
      }

      return taxLines
    } catch (error) {
      throw error
    }
  }

  private getDefaultTaxLines(
    itemLines: ItemTaxCalculationLine[],
    shippingLines: ShippingTaxCalculationLine[]
  ): ProviderTaxLine[] {
    const defaultRate = 0.15
    const defaultName = "Default Tax"
    const defaultCode = "DEFAULT"

    const taxLines: ProviderTaxLine[] = itemLines.map((line) => ({
      rate: defaultRate,
      name: defaultName,
      code: defaultCode,
      item_id: line.item.id
    }))

    if (shippingLines?.length) {
      const shippingTaxLines = shippingLines.map((line) => ({
        rate: defaultRate,
        name: defaultName,
        code: defaultCode,
        shipping_method_id: line.shipping_method.id
      }))
      taxLines.push(...shippingTaxLines)
    }

    return taxLines
  }
}

export default ProvinceTaxProvider 