import { useAuthSlice } from "@/app/providers";
import { Button } from "@/shared/ui/button";
import { useNavigate } from "react-router";

export const ApplyEventButton = () => {
  const { user } = useAuthSlice();
  const navigate = useNavigate();

  function handleApplyEventPlace() {
    if (user == null) {
      navigate("/login");
    } else {
      window.open(
        `https://t.me/cyberia_tickets_bot?start=${user!.address}_verifyshaman`,
        "_blank",
      );
    }
  }

  return (
    !["localprovider", "verifiedshaman", "master"].includes(
      user?.role ?? "",
    ) && (
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
