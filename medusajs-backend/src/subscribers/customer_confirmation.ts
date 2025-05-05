import dotenv from "dotenv";
import { 
    type SubscriberConfig, 
    type SubscriberArgs,
    CustomerService,
} from "@medusajs/medusa"

dotenv.config();

export default async function handleCustomerCreated({ 
    data, eventName, container, pluginOptions, 
}: SubscriberArgs<Record<string, string>>) {
    const sendGridService = container.resolve("sendgridService")

    sendGridService.sendEmail({
    templateId: process.env.SENDGRID_CUSTOMER_CONFIRMATION_TEMPLATE,
    from: process.env.SENDGRID_FROM,
    to: data.email,
    dynamic_template_data: {
        first_name: data.first_name,
        last_name: data.last_name,
    },
    })
}

export const config: SubscriberConfig = {
    event: CustomerService.Events.CREATED,
    context: {
    subscriberId: "customer-created-handler",
    },
}