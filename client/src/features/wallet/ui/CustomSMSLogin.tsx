import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { apiClient } from "@/shared/api";
import { client } from "@/shared/lib/web3";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useState } from "react";
import { useActiveAccount, useConnect } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";

const wallet = inAppWallet();

export const CustomSMSLogin: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { connect, isConnecting } = useConnect();
  const account = useActiveAccount();
  const { setUser, setStatus } = useAuthSlice();

  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/custom/send-sms/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send code");
      }

      setIsCodeSent(true);
      console.log("SMS sent:", data.development_note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify code with backend
      const response = await fetch("/api/auth/custom/verify-code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Code verification failed");
      }

      // Use the custom payload to connect wallet
      await connect(async () => {
        await wallet.connect({
          client,
          strategy: "auth_endpoint",
          payload: JSON.stringify(data.payload),
        });
        return wallet;
      });

      // After successful wallet connection, authenticate the user
      try {
        const userData = await apiClient.GET("/api/users/current/");
        if (userData.data) {
          setUser(userData.data as User);
          setStatus("connected");
        }
      } catch (authError) {
        console.error(
          "Failed to authenticate user after wallet connection:",
          authError,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  if (account) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-green-50">
        <h3 className="text-lg font-semibold text-green-800">
          ✅ Custom SMS Wallet Connected!
        </h3>
        <p className="text-sm">Address: {account.address}</p>
        <p className="text-sm text-green-600">
          Authenticated via phone: {phoneNumber}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">📱 Custom SMS Authentication</h3>
      <p className="text-sm text-muted-foreground">
        {!isCodeSent
          ? "Enter your phone number to receive a verification code (hardcoded: 123456)"
          : "Enter the verification code sent to your phone"}
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {!isCodeSent ? (
        <div className="space-y-3">
          <Input
            type="tel"
            placeholder="Phone number (e.g., +1234567890)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <Button
            onClick={handleSendCode}
            disabled={loading || !phoneNumber}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Verification code (use: 123456)"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleConnectWallet}
              disabled={loading || !verificationCode || isConnecting}
              className="flex-1"
            >
              {loading || isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsCodeSent(false);
                setVerificationCode("");
                setError(null);
              }}
              disabled={loading}
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
