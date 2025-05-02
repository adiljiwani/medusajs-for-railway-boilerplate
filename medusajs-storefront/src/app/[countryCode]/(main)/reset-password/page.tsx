"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Input from "@modules/common/components/input";
import { SubmitButton } from "@modules/checkout/components/submit-button";
import ErrorMessage from "@modules/checkout/components/error-message";

const ResetPassword: React.FC = () => {
  const searchParams = useSearchParams();
  const encodedToken = searchParams.get("token");
  const encodedEmail = searchParams.get("email");
  
  const token = encodedToken ? decodeURIComponent(encodedToken.replace(/ /g, '+')) : null;
  const email = encodedEmail ? decodeURIComponent(encodedEmail.replace(/ /g, '+')) : null;
  
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setMessage("Invalid or expired reset link.");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/password-reset-submission`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            token, 
            email, 
            newPassword 
          }),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.message || "An error occurred");
      }

      setMessage("Password reset successful. You can now log in with your new password.");
      setIsSubmitting(false);
    } catch (error: any) {
      setMessage(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm flex flex-col items-center">
      <h1 className="text-large-semi uppercase mb-6">Reset Password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        Enter your new password below.
      </p>
      <form className="w-full flex flex-col" onSubmit={handleSubmit}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="New Password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm Password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <SubmitButton>
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </SubmitButton>
      </form>
      {message && <ErrorMessage error={message} />}
    </div>
  );
};

export default ResetPassword;