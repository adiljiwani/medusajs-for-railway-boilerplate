import { 
  useAdminCustomer, 
  useAdminUpdateCustomer,
  useAdminCustomerGroups,
  useAdminCreateCustomerGroup,
  useAdminUpdateCustomerGroup,
  useMedusa
} from "medusa-react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Switch, Container, StatusBadge, Select, Button } from "@medusajs/ui";
import type { WidgetConfig, WidgetProps } from "@medusajs/admin";

// Define the mapping between price lists and customer groups
const PRICE_LIST_TO_GROUP_MAP = {
  "16": { name: "Tier 1", groupId: "cgrp_01J4ZD0VNA1609TXPNPTMDB8RV" },
  "17": { name: "Tier 2", groupId: "cgrp_01J4ZD17C8CZYSZGRYMGA68XMS" },
  "18": { name: "Tier 3", groupId: "cgrp_01J4ZD1JMBJ6VMP30N1FVB467F" }
};

// Define the available pricing tiers
const PRICING_TIERS = [
  { id: "16", name: "Tier 1" },
  { id: "17", name: "Tier 2" },
  { id: "18", name: "Tier 3" }
];

const CustomerApprovalWidget = (props: WidgetProps) => {
  const { id } = useParams();
  const { customer, isLoading } = useAdminCustomer(id!);
  const updateCustomer = useAdminUpdateCustomer(id!);
  const { client } = useMedusa();

  const [isApproved, setIsApproved] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<string>("none");
  const { notify } = props;

  useEffect(() => {
    if (customer && customer.metadata) {
      setIsApproved(Boolean((customer.metadata as Record<string, any>).approved));
      const priceListId = (customer.metadata as Record<string, any>).price_list_id;
      setSelectedPriceList(priceListId || "none");
    }
  }, [customer]);

  const handleApprovalToggle = async (checked: boolean) => {
    setIsApproved(checked);

    try {
      await updateCustomer.mutateAsync({
        metadata: { 
          ...customer.metadata, 
          approved: checked,
          price_list_id: selectedPriceList === "none" ? undefined : selectedPriceList
        },
      });

      notify.success(
        "Success",
        `Customer ${customer.first_name} ${customer.last_name} has been ${
          checked ? "approved" : "disapproved"
        } successfully.`
      );
    } catch (error) {
      console.error("Failed to update customer:", error);
      notify.error("Error", "Failed to update customer status.");
    }
  };

  const handleSave = async () => {
    try {
      // First update the customer metadata
      await updateCustomer.mutateAsync({
        metadata: { 
          ...customer.metadata, 
          price_list_id: selectedPriceList === "none" ? undefined : selectedPriceList,
          approved: isApproved 
        },
      });

      // Remove from all possible customer groups first
      for (const groupInfo of Object.values(PRICE_LIST_TO_GROUP_MAP)) {
        try {
          await client.admin.customerGroups.removeCustomers(groupInfo.groupId, {
            customer_ids: [{ id: customer.id }]
          });
        } catch (error) {
          // Ignore errors from groups the customer isn't in
          console.log("Customer not in group:", groupInfo.groupId);
        }
      }

      // If a new pricing tier is selected, add to that group
      if (selectedPriceList !== "none") {
        const customerGroupId = PRICE_LIST_TO_GROUP_MAP[selectedPriceList as keyof typeof PRICE_LIST_TO_GROUP_MAP]?.groupId;
        if (customerGroupId) {
          await client.admin.customerGroups.addCustomers(customerGroupId, {
            customer_ids: [{ id: customer.id }]
          });
        }
      }

      notify.success("Success", "Customer pricing tier updated successfully.");
    } catch (error) {
      console.error("Failed to update customer pricing tier:", error);
      // Log the actual error for debugging
      if ((error as any)?.response?.data) {
        console.error("API Error:", (error as any).response.data);
      }
      notify.error("Error", "Failed to update customer pricing tier.");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!customer) {
    return null;
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <h3 className="inter-large-semibold mb-2">Approval Status</h3>
            <div className="flex items-center">
              <Switch checked={isApproved} onCheckedChange={handleApprovalToggle} />
              <StatusBadge className="ml-2" color={isApproved ? "green" : "red"}>
                {isApproved ? "Approved" : "Not Approved"}
              </StatusBadge>
            </div>
          </div>

          <div>
            <h3 className="inter-large-semibold mb-2">Pricing Tier</h3>
            <div className="flex items-center gap-2">
              <div className="w-[200px]">
                <Select value={selectedPriceList} onValueChange={setSelectedPriceList}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select a pricing tier" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="none">None</Select.Item>
                    {PRICING_TIERS.map((tier) => (
                      <Select.Item key={tier.id} value={tier.id}>
                        {tier.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <Button 
                variant="primary"
                onClick={handleSave}
              >
                Save Pricing Tier
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export const config: WidgetConfig = {
  zone: "customer.details.before",
};

export default CustomerApprovalWidget;
