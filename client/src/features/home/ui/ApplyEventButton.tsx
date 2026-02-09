import { useAuthSlice } from "@/app/providers";
import { createTelegramLinkToken } from "@/entities/user";
import { hasAnyRole } from "@/shared/lib/RBAC";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router";

export const ApplyEventButton = () => {
  const { user } = useAuthSlice();
  const navigate = useNavigate();
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  async function handleApplyEventPlace() {
    if (user == null) {
      navigate("/account");
    } else if (user.socials.find((s) => s.network === "telegram")) {
      navigate("/verify");
    } else {
      setIsGeneratingToken(true);
      try {
        const response = await createTelegramLinkToken("verifyshaman");
        if (response.error) {
          // Handle error silently or show toast
          return;
        }
        const { hash } = response.data;
        window.open(
          `https://t.me/cyberia_tickets_bot?start=${hash}_verifyshaman`,
          "_blank",
        );
      } finally {
        setIsGeneratingToken(false);
      }
    }
  }

  // Hide button for localproviders and masters
  const hasProviderOrMasterRole = hasAnyRole(
    user?.roles,
    "localprovider",
    "master",
  );

  return (
    !hasProviderOrMasterRole && (
      <div className="w-full absolute bottom-1 p-4">
        <Button
          onClick={handleApplyEventPlace}
          filling="outline"
          className="w-full"
          disabled={isGeneratingToken}
        >
          {isGeneratingToken
            ? "Generating secure link..."
            : "Apply new event space"}
        </Button>
      </div>
    )
  );
};
