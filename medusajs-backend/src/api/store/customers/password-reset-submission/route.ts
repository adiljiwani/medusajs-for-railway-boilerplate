import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const { token, email, newPassword } = req.body as { token: string; email: string; newPassword: string };

    if (!token || !email || !newPassword) {
        return res.status(400).json({ message: "Token, email, and new password are required" });
    }

    const customerService = req.scope.resolve("customerService");

    try {
        console.log(`[PasswordReset] Attempting password reset for email: ${email}`);
        console.log(`[PasswordReset] Token received: ${token.substring(0, 10)}...`);

        // Retrieve the customer by email
        const customer = await customerService.retrieveByEmail(email);

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Update the password
        try {
            await customerService.update(customer.id, {
                password: newPassword,
                // password_hash: token // Use the token as the current password hash for verification
            });
            
            console.log(`[PasswordReset] Password updated successfully for customer ID: ${customer.id}`);
            return res.status(200).json({ message: "Password has been reset successfully" });
        } catch (error) {
            console.error(`[PasswordReset] Password update failed:`, error);
            return res.status(400).json({ 
                message: "Failed to update password",
                details: error.message 
            });
        }
    } catch (error) {
        console.error(`[PasswordReset] Error processing request:`, error);
        return res.status(500).json({ message: "Error processing request", error: error.message });
    }
}