import dotenv from "dotenv";
 import { 
     type SubscriberConfig, 
     type SubscriberArgs,
     CustomerService,
   } from "@medusajs/medusa";



 dotenv.config();

 export default async function handlePasswordResetRequest({
   data, eventName, container, pluginOptions,
 }: SubscriberArgs<Record<string, string>>) {
   const sendGridService = container.resolve("sendgridService");

   // Construct the reset password URL with proper encoding
   const resetPasswordUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.email).replace(/\+/g, '%2B')}`;
   console.log(`this is the password reset url: ${resetPasswordUrl}`);

   // Send the reset password email
   sendGridService.sendEmail({
     templateId: process.env.SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE,
     from: process.env.SENDGRID_FROM,
     to: data.email,
     dynamic_template_data: {
       first_name: data.first_name,
       reset_password_url: resetPasswordUrl,
     },
   });
 }

 export const config: SubscriberConfig = {
   event: CustomerService.Events.PASSWORD_RESET,
   context: {
     subscriberId: "password-reset-handler",
   },
 }