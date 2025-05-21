import { Text, clx } from "@medusajs/ui"

import { ProductQuantityInfo } from "../product-actions"

export default async function PreviewQuantity({ quantity }: { quantity: ProductQuantityInfo }) {
    let displayText: string;

    if (quantity.available_quantity < 0) {
        displayText = "Unknown quantity";
    }
    else if (quantity.available_quantity < 100) {
      displayText = "< 100 in stock";
    } else {
      const roundedQuantity = Math.floor(quantity.available_quantity / 100) * 100;
      displayText = `100+ in stock`;
    }
  
    return (
        <Text
          className={clx("text-ui-fg-muted")}
          data-testid="quantity"
        >
          {displayText}
        </Text>
      );
}
