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
  console.log("[PasswordReset] Starting password reset request handler");
  console.log("[PasswordReset] Event data:", JSON.stringify(data, null, 2));

  try {
    const sendGridService = container.resolve("sendgridService");
    console.log("[PasswordReset] SendGrid service resolved:", !!sendGridService);

    if (!data.token || !data.email) {
      console.error("[PasswordReset] Missing required data:", { token: !!data.token, email: !!data.email });
      throw new Error("Missing required data for password reset");
    }

    // Construct the reset password URL with proper encoding
    const resetPasswordUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.email).replace(/\+/g, '%2B')}`;
    console.log(`[PasswordReset] Reset password URL: ${resetPasswordUrl}`);

    // Send the reset password email
    console.log("[PasswordReset] Sending email with template:", process.env.SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE);
    console.log("[PasswordReset] Email configuration:", {
      from: process.env.SENDGRID_FROM,
      to: data.email,
      templateId: process.env.SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE
    });

    await sendGridService.sendEmail({
      templateId: process.env.SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE,
      from: process.env.SENDGRID_FROM,
      to: data.email,
      dynamic_template_data: {
        first_name: data.first_name || "there",
        reset_password_url: resetPasswordUrl,
      },
    });
    console.log("[PasswordReset] Email sent successfully");
  } catch (error) {
    console.error("[PasswordReset] Error sending password reset email:", error);
    throw error;
  }
}

export const config: SubscriberConfig = {
  event: CustomerService.Events.PASSWORD_RESET,
  context: {
    subscriberId: "password-reset-handler",
  },
};