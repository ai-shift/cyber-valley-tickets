import { useAuthSlice } from "@/app/providers";
import { hasAnyRole } from "@/shared/lib/RBAC";
import { Button } from "@/shared/ui/button";
import { useNavigate } from "react-router";

export const ApplyEventButton = () => {
  const { user } = useAuthSlice();
  const navigate = useNavigate();

  function handleApplyEventPlace() {
    if (user == null) {
      navigate("/account");
    } else if (user.socials.find((s) => s.network === "telegram")) {
      navigate("/verify");
    } else {
      window.open(
        `https://t.me/cyberia_tickets_bot?start=${user!.address}_verifyshaman`,
        "_blank",
      );
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
        >
          Apply new event space
        </Button>
      </div>
    )
  );
};
