import React, { useState } from "react";
import { useFormState } from "react-dom";

import { LOGIN_VIEW } from "@modules/account/templates/login-template";
import Input from "@modules/common/components/input";
import { logCustomerIn } from "@modules/account/actions";
import ErrorMessage from "@modules/checkout/components/error-message";
import { SubmitButton } from "@modules/checkout/components/submit-button";
import dotenv from "dotenv";
dotenv.config();

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void;
};

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(logCustomerIn, null);
  const [email, setEmail] = useState(""); // Track the entered email
  const [resetMessage, setResetMessage] = useState<string | null>(null); // Track reset password message


  const [loading, setLoading] = useState(false); // Prevent duplicate requests
  const handlePasswordReset = async () => {
    if (loading) return; // Prevent multiple requests
    setLoading(true);

    try {
      console.log("Password reset initiated"); // Debug log
      
      if (!email) {
        setResetMessage("Please enter your email address.");
        console.log("Validation failed: No email provided");
        setLoading(false); // Reset loading state for validation errors
        return;
      }
    
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setResetMessage("Please enter a valid email address.");
        console.log("Validation failed: Invalid email format");
        setLoading(false); // Reset loading state for validation errors
        return;
      }
    
      console.log("Making API call to reset password");
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/password-reset-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("API call response status:", response.status);

      if (response.ok) {
        setResetMessage("Password reset email sent successfully.");
        console.log("Password reset email sent successfully");
      } else {
        const error = await response.json();
        setResetMessage(error.message || "Failed to send password reset email.");
        console.log("API error:", error.message || "Unknown error");
      }
    } catch (error) {
      setResetMessage("An error occurred. Please try again later.");
      console.error("API call failed:", error);
    } finally {
      setLoading(false); // Reset loading state after API call completes
    }
  };  

  return (
    <div className="max-w-sm w-full flex flex-col items-center" data-testid="login-page">
      <h1 className="text-large-semi uppercase mb-6">Welcome back</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Sign in to access an enhanced shopping experience.
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Update email state
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          Sign in
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Not a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          Join us
        </button>
        .
      </span>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Forgot your password?{" "}
        <button
          onClick={handlePasswordReset} // Call the reset function
          disabled={loading}
          className="underline"
          data-testid="reset-password-button"
        >
          {loading ? "Sending..." : "Reset it here"}
        </button>
      </span>
      {resetMessage && (
        <p className="text-center text-small-regular text-ui-fg-base mt-4">{resetMessage}</p>
      )}
    </div>
  );
};

export default Login;