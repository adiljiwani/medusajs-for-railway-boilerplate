import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

 export async function POST(req: MedusaRequest, res: MedusaResponse) {
   const { email } = req.body as { email: string };

   if (!email) {
     return res.status(400).json({ message: "Email is required" });
   }

   const customerService = req.scope.resolve("customerService");
   const eventBusService = req.scope.resolve("eventBusService");

   try {
     // Retrieve customer by email
     const customer = await customerService.retrieveByEmail(email);

     if (!customer) {
       return res.status(404).json({ message: "Customer not found" });
     }

     // Generate password reset token
     const token = await customerService.generateResetPasswordToken(customer.id);

     // Emit password reset event
     await eventBusService.emit("customer.password_reset", {
       email: customer.email,
       token,
       first_name: customer.first_name,
       last_name: customer.last_name,
     });

     console.log(`[PasswordReset] Password reset token generated for email: ${email}, token: ${token}`);

     return res.status(200).json({ message: "Password reset email sent" });
   } catch (error) {
     console.error(`[PasswordReset] Error processing request:`, error);
     return res.status(500).json({ message: "Error processing request", error: error.message });
   }
 }